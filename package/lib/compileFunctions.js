'use strict';

/* eslint no-use-before-define: 0 */

const path = require('path');

const _ = require('lodash');
const BbPromise = require('bluebird');

module.exports = {
  compileFunctions() {
    this.compileStorage();
    this.compileService();
    this.compileFunctionsAndEvents();
    return BbPromise.resolve();
  },

  compileStorage() {
    const objectId = this.provider.getStorageObjectId();
    const resources = this.serverless.service.provider.compiledConfigurationTemplate.Resources;

    const bucketName = this.provider.getDeploymentBucketName();

    const artifact = this.serverless.service.package.artifact;
    const fileName = artifact.split(path.sep).pop();
    const artifactFilePath =
      `${this.serverless.service.package.artifactDirectoryName}/${fileName}`;
    this.serverless.service.package.artifactFilePath = artifactFilePath;

    const packagePath = 
      path.join(this.serverless.config.servicePath || '.', '.serverless');
    const filePath = path.join(packagePath, fileName);

    const objectResource = this.provider.getObjectResource(artifactFilePath, filePath);

    _.merge(resources, { [objectId]: objectResource });
  },

  compileService() {
    const serviceId = this.provider.getServiceId();
    const resources = this.serverless.service.provider.compiledConfigurationTemplate
      .Resources;
    const serviceResource = this.provider.getServiceResource();
    _.merge(resources, { [serviceId]: serviceResource});
  },

  compileFunctionsAndEvents() {
    const resources = this.serverless.service.provider.compiledConfigurationTemplate.Resources;
    this.serverless.service.getAllFunctions().forEach((functionName) => {
      const funcObject = this.serverless.service.getFunction(functionName);

      this.serverless.cli
        .log(`Compiling function "${functionName}"...`);

      const funcId = this.provider.getFunctionLogicalId(funcObject.name);
      const funcResource = this.provider.getFunctionResource(funcObject);
      // recursive merge
      _.merge(resources, { [funcId]: funcResource });

      this.compileApiGateway.call(this, funcObject);
      this.compileEvents.call(this, funcObject);
    });
  },

  compileApiGateway(funcObject) {
    const resources = this.serverless.service.provider.compiledConfigurationTemplate.Resources;
    const agLogicalId = this.provider.getApiGroupLogicalId();
    const agRoleId = this.provider.getApiRoleLogicalId();

    if (funcObject.events.some(needsApiGateway) &&
      !resources[agLogicalId]) {
      resources[agLogicalId] = this.provider.getApiGroupResource();
      resources[agRoleId] = this.provider.getApiRoleResource();
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
        const apiResource = this.provider.getHttpApiResource(event.http, funcObject);
        const apiName = apiResource.Properties.ApiName;
        _.merge(resources, { [apiName]: apiResource });
      }
    });
  }
};

function needsApiGateway(event) {
  return Object.keys(event)[0] === 'http';
}
