'use strict';

/* eslint no-use-before-define: 0 */

const path = require('path');

const _ = require('lodash');
const BbPromise = require('bluebird');

module.exports = {
  compileFunctions() {
    this.resources = this.serverless.service.provider.compiledConfigurationTemplate.Resources;
    this.compileStorage(this.serverless.service.package.artifact);
    this.compileFunctionsAndEvents();
    return BbPromise.resolve();
  },

  compileFunction(funcName, funcObject) {
    this.resources = this.serverless.service.provider.compiledConfigurationTemplate.Resources;
    this.compileStorage(funcObject.artifact);
    this.compileFunctionAndEvent(funcName, funcObject);
    return BbPromise.resolve();
  },

  compileStorage(artifact) {
    const objectId = this.provider.getStorageObjectId();
    const resources = this.resources;

    const bucketName = this.provider.getDeploymentBucketName();

    const fileName = artifact.split(path.sep).pop();
    const directory = this.provider.getArtifactDirectoryName();
    const artifactFilePath = `${directory}/${fileName}`;
    this.serverless.service.package.artifactFilePath = artifactFilePath;
    this.serverless.service.package.artifactDirectoryName = directory;

    const packagePath = 
      path.join(this.serverless.config.servicePath || '.', '.serverless');
    const filePath = path.join(packagePath, fileName);

    const objectResource = this.provider.getObjectResource(artifactFilePath, filePath);

    _.merge(resources, { [objectId]: objectResource });
  },

  compileLogProject() {
    const resources = this.resources;
    // resource: log project exec role
    resources[execRoleId] = execResource;
  },

  compileFunctionsAndEvents() {
    this.serverless.service.getAllFunctions().forEach((functionName) => {
      const funcObject = this.serverless.service.getFunction(functionName);
      this.compileFunctionAndEvent(functionName, funcObject);
    });
  },

  compileFunctionAndEvent(functionName, funcObject) {
    const resources = this.resources;
    this.serverless.cli
      .log(`Compiling function "${functionName}"...`);

    const funcId = this.provider.getFunctionLogicalId(funcObject.name);
    const funcResource = this.provider.getFunctionResource(funcObject);
    // recursive merge
    _.merge(resources, { [funcId]: funcResource });

    this.compileApiGateway.call(this, funcObject);
    this.compileEvents.call(this, funcObject);
  },

  compileApiGateway(funcObject) {
    const resources = this.resources;
    const agLogicalId = this.provider.getApiGroupLogicalId();
    const invokeRoleId = this.provider.getInvokeRoleLogicalId();

    if (funcObject.events.some(needsApiGateway) &&
      !resources[agLogicalId]) {
      resources[agLogicalId] = this.provider.getApiGroupResource();
      let invokeResource = resources[invokeRoleId];
      if (!invokeResource) {
        invokeResource = this.provider.getInvokeRoleResource();
      }
      this.provider.makeRoleAccessibleFromAG(invokeResource);
      resources[invokeRoleId] = invokeResource;
    }
  },

  compileEvents(funcObject) {
    const resources = this.resources;
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
