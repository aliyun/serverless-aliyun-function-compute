'use strict';

/* eslint no-use-before-define: 0 */

const path = require('path');

const _ = require('lodash');
const BbPromise = require('bluebird');

module.exports = {
  compileFunctions() {
    this.compileStorage();
    this.compileService();
    this._compileFunctions();
    return BbPromise.resolve();
  },

  compileStorage() {
    const objectId = this.provider.getStorageObjectId();
    const resources = this.serverless.service.provider.compiledConfigurationTemplate.Resources;

    const bucketName = this.serverless.service.provider.deploymentBucketName;

    const artifact = this.serverless.service.package.artifact;
    const fileName = artifact.split(path.sep).pop();
    const artifactFilePath =
      `${this.serverless.service.package.artifactDirectoryName}/${fileName}`;
    this.serverless.service.package.artifactFilePath = artifactFilePath;

    const packagePath = 
      path.join(this.serverless.config.servicePath || '.', '.serverless');
    const filePath = path.join(packagePath, fileName);

    const objectResource = getObjectResource(bucketName, artifactFilePath, filePath);

    _.merge(resources, { [objectId]: objectResource });
  },

  compileService() {
    const serviceId = this.provider.getServiceId();
    const serviceName = this.provider.getServiceName(this.options.stage);
    const resources = this.serverless.service.provider.compiledConfigurationTemplate
      .Resources;
    const serviceResource = getServiceResource(serviceName, this.options.region);
    _.merge(resources, { [serviceId]: serviceResource});
  },

  _compileFunctions() {
    const resources = this.serverless.service.provider.compiledConfigurationTemplate.Resources;
    const serviceName = this.provider.getServiceName(this.options.stage);
    this.serverless.service.getAllFunctions().forEach((functionName) => {
      const funcObject = this.serverless.service.getFunction(functionName);

      this.serverless.cli
        .log(`Compiling function "${functionName}"...`);

      validateHandlerProperty(funcObject, functionName);
      validateEventsProperty(funcObject, functionName);

      const funcId = this.provider.getFunctionLogicalId(funcObject.name);
      const funcResource = getFunctionResource(
        funcObject,
        this.serverless.service,
        serviceName);
      // recursive merge
      _.merge(resources, { [funcId]: funcResource });

      this.compileApiGateway.call(this, funcObject);
      this.compileEvents.call(this, funcObject);
    });
  },

  compileApiGateway(funcObject) {
    const resources = this.serverless.service.provider.compiledConfigurationTemplate.Resources;
    const agLogicalId = this.provider.getApiGroupLogicalId();

    if (funcObject.events.some(needsApiGateway) &&
      !resources[agLogicalId]) {
      resources[agLogicalId] = getApiGroupResource(this.provider, this.options.region, this.options.stage);
    }
  },

  compileEvents(funcObject) {
    const resources = this.serverless.service.provider.compiledConfigurationTemplate.Resources;
    const agLogicalId = this.provider.getApiGroupLogicalId();

    funcObject.events.forEach((event) => {
      const eventType = Object.keys(event)[0];

      // TODO: support more event types
      if (eventType === 'http') {
        // TODO: ROS does not support API gateway and FC at the moment
        // So this is fake config
        const apiResource = getHttpApiResource(event.http, funcObject, this.provider, this.options.stage);
        const apiName = apiResource.Properties.ApiName;
        _.merge(resources, { [apiName]: apiResource });
      }
    });
  }
};

function validateHandlerProperty(funcObject, functionName) {
  if (!funcObject.handler) {
    const errorMessage = [
      `Missing "handler" property for function "${functionName}".`,
      ' Your function needs a "handler".',
      ' Please check the docs for more info.',
    ].join('');
    throw new Error(errorMessage);
  }
}

function validateEventsProperty (funcObject, functionName) {
  if (!funcObject.events || funcObject.events.length === 0) {
    const errorMessage = [
      `Missing "events" property for function "${functionName}".`,
      ' Your function needs at least one "event".',
      ' Please check the docs for more info.',
    ].join('');
    throw new Error(errorMessage);
  }

  if (funcObject.events.length > 1) {
    const errorMessage = [
      `The function "${functionName}" has more than one event.`,
      ' Only one event per function is supported.',
      ' Please check the docs for more info.',
    ].join('');
    throw new Error(errorMessage);
  }

  const supportedEvents = [
    'http',
    // 'event'
  ];
  const eventType = Object.keys(funcObject.events[0])[0];
  if (supportedEvents.indexOf(eventType) === -1) {
    const errorMessage = [
      `Event type "${eventType}" of function "${functionName}" not supported.`,
      ` supported event types are: ${supportedEvents.join(', ')}`,
    ].join('');
    throw new Error(errorMessage);
  }
};

function getFunctionResource(funcObject, service, serviceName) {
  // Function-wise setting > service-wise setting > default
  const memorySize = funcObject.memorySize
    || service.provider.memorySize
    || 128;
  const timeout = funcObject.timeout
    || service.provider.timeout
    || 30;

  return {
    "Type": "ALIYUN::FC::Function",
    "Properties": {
      "name": funcObject.name,
      "service": serviceName,
      "handler": funcObject.handler,
      "memorySize": memorySize,
      "timeout": timeout,
      "runtime": "nodejs4.4",
      "code": {
        "ossBucketName": service.provider.deploymentBucketName,
        "ossObjectName": service.package.artifactFilePath
      }
    }
  }
}

function getHttpApiResource(event, funcObject, provider, stage) {
  const eventType = 'http';
  return {
    "Type": "ALIYUN::API::HTTP",
    "Properties": {
      "GroupName": provider.getApiGroupName(stage),
      "GroupId": undefined,
      "ApiName": provider.getApiName(eventType, funcObject.name),
      "Visibility": event.Visibility || "PUBLIC",
      "Description": provider.getApiDesc('http', funcObject.name, stage),
      "AuthType": event.AuthType || "ANONYMOUS",
      "RequestProtocol": eventType.toUpperCase(),
      "RequestHttpMethod": (event.RequestHttpMethod || event.method || "GET").toUpperCase(),
      "RequestPath": event.RequestPath || event.path,
      "RequestParameters": event.RequestParameters || [],
      "ServiceConfig": {
        "Ref": provider.getFunctionLogicalId(funcObject.name)
      }
    }
  };
}

function needsApiGateway(event) {
  return Object.keys(event)[0] === 'http';
}

function getApiGroupResource(provider, region, stage) {
  return {
    "Type": "ALIYUN::API::APIGroup",
    "Properties": {
      "GroupName": provider.getApiGroupName(stage),
      "Description": provider.getApiGroupDesc(stage),
      "Region": region,
      "GroupId": undefined,
      "SubDomain": undefined
    }
  };
}

function getServiceResource(serviceName, region) {
  return {
    "Type": "ALIYUN::FC::Service",
    "Properties": {
      "name": serviceName,
      "region": region,
      "id": undefined
    }
  };
}

function getObjectResource(bucketName, objectName, localPath) {
  return {
    "Type": "ALIYUN::OSS:Object",
    "Properties": {
      "BucketName": bucketName,
      "ObjectName": objectName,
      "LocalPath": localPath
    }
  }
}