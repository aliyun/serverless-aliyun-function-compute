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
    const artifactFilePath = this.serverless.service.package.artifact;
    const fileName = artifactFilePath.split(path.sep).pop();

    this.serverless.service.package
      .artifactFilePath = `${this.serverless.service.package.artifactDirectoryName}/${fileName}`;
    const objectId = this.provider.getStorageObjectId();
    this.serverless.service.provider.compiledConfigurationTemplate.resources[objectId].object = this.serverless.service.package
      .artifactFilePath;
  },

  compileService() {
    const serviceId = this.provider.getServiceId();
    const serviceName = this.provider.getServiceName(this.options.stage);
    this.serverless.service.provider.compiledConfigurationTemplate.resources[serviceId] = getServiceResource(serviceName, this.options.region);
  },

  _compileFunctions() {
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

      // Function-wise setting > service-wise setting > default
      funcResource.memorySize = _.get(funcObject, 'memorySize')
        || _.get(this, 'serverless.service.provider.memorySize')
        || 128;
      funcResource.timeout = _.get(funcObject, 'timeout')
        || _.get(this, 'serverless.service.provider.timeout')
        || 30;

      _.merge(this.serverless.service.provider.compiledConfigurationTemplate.resources,
        {
          [funcId]: funcResource
        });

      this.compileApiGateway.call(this, funcObject);
      this.compileEvents.call(this, funcObject);
    });
  },

  compileApiGateway(funcObject) {
    const resources = this.serverless.service.provider.compiledConfigurationTemplate.resources;
    const agLogicalId = this.provider.getApiGroupLogicalId();
    const agName = this.provider.getApiGroupName(this.options.stage);
    
    if (funcObject.events.some(needsApiGateway) &&
      !resources[agLogicalId]) {
      resources[agLogicalId] = getApiGroupResource(agName, this.options.region);
    }
  },

  compileEvents(funcObject) {
    const resources = this.serverless.service.provider.compiledConfigurationTemplate.resources;
    const agLogicalId = this.provider.getApiGroupLogicalId();
    const agName = this.provider.getApiGroupName(this.options.stage);

    funcObject.events.forEach((event) => {
      const eventType = Object.keys(event)[0];

      // TODO: support more event types
      if (eventType === 'http') {
        // TODO: ROS does not support API gateway and FC at the moment
        // So this is fake config

        const apiResource = getHttpApiResource(event.http, this.serverless.service);
        const funcId = this.provider.getFunctionLogicalId(funcObject.name);
        const apiId = this.provider.getHttpApiId(eventType, funcObject.name);

        apiResource.service = { ref: funcId };
        apiResource.apiName = apiId;
        apiResource.groupName = agName;

        _.merge(this.serverless.service.provider.compiledConfigurationTemplate.resources,
          {
            [apiId]: apiResource
          });
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
  return {
    "type": "ALIYUN::FC::Function",
    "name": funcObject.name,
    "service": serviceName,
    "handler": funcObject.handler,
    "memorySize": 128,
    "timeout": 30,
    "runtime": "nodejs4.4",
    "code": {
      "ossBucketName": service.provider.deploymentBucketName,
      "ossObjectName": service.package.artifactFilePath
    }
  }
}

function getHttpApiResource(event, service) {
  return {
    "type": "ALIYUN::API::HTTP",
    "groupName": undefined,
    "groupId": undefined,
    "apiName": undefined,
    "protocol": "http",
    "method": event.method.toUpperCase(),
    "path": event.path,
    "service": {
      "ref": undefined
    }
  };
}

function needsApiGateway(event) {
  return Object.keys(event)[0] === 'http';
}

function getApiGroupResource(agName, region) {
  return {
    "type": "ALIYUN::API::APIGroup",
    "name": agName,
    "id": undefined,
    "region": region,
    "domain": undefined
  }
}

function getServiceResource(serviceName, region) {
  return {
    "type": "ALIYUN::FC::Service",
    "name": serviceName,
    "region": region,
    "id": undefined
  }
}