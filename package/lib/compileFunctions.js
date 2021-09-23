'use strict';

/* eslint no-use-before-define: 0 */

const path = require('path');

const _ = require('lodash');

module.exports = {
  compileFunctions() {
    this.resources = this.serverless.service.provider.compiledConfigurationTemplate.Resources;
    this.compileStorage(this.serverless.service.package.artifact);
    this.serverless.service.getAllFunctions().forEach((functionName) => {
      const funcObject = this.serverless.service.getFunction(functionName);
      this.compileFunctionAndEvent(functionName, funcObject);
    });
  },

  compileFunction(funcName, funcObject) {
    this.resources = this.serverless.service.provider.compiledConfigurationTemplate.Resources;
    // Notice artifact is different
    this.compileStorage(funcObject.package.artifact);
    this.compileFunctionAndEvent(funcName, funcObject);
  },

  compileStorage(artifact) {
    const objectId = this.provider.getStorageObjectId();
    const resources = this.resources;

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

  compileFunctionAndEvent(functionName, funcObject) {
    const resources = this.resources;
    this.serverless.cli
      .log(`Compiling function "${functionName}"...`);

    const funcId = this.provider.getFunctionLogicalId(funcObject.name);
    const funcResource = this.provider.getFunctionResource(funcObject);
    // recursive merge
    _.merge(resources, { [funcId]: funcResource });

    this.compileApiGateway.call(this, funcObject);
    this.compileOSSTrigger.call(this, funcObject);
    this.compileEvents.call(this, funcObject);
  },

  compileApiGateway(funcObject) {
    const resources = this.resources;
    const agLogicalId = this.provider.getApiGroupLogicalId();
    const invokeRoleId = this.provider.getInvokeRoleLogicalId();

    if (funcObject.events.some(needsApiGateway)) {
      if (!resources[agLogicalId]) {
        resources[agLogicalId] = this.provider.getApiGroupResource();
      }
      let invokeResource = resources[invokeRoleId];
      if (!invokeResource) {
        invokeResource = this.provider.getInvokeRoleResource();
      }
      this.provider.makeRoleAccessibleFromAG(invokeResource);
      resources[invokeRoleId] = invokeResource;
    }
  },

  compileOSSTrigger(funcObject) {
    const resources = this.resources;
    const invokeRoleId = this.provider.getInvokeRoleLogicalId();

    if (funcObject.events.some(needsOSSTrigger)) {
      let invokeResource = resources[invokeRoleId];
      if (!invokeResource) {
        invokeResource = this.provider.getInvokeRoleResource();
      }
      this.provider.makeRoleAccessibleFromOSS(invokeResource);
      resources[invokeRoleId] = invokeResource;
    }
  },

  compileEvents(funcObject) {
    const resources = this.resources;

    funcObject.events.forEach((event) => {
      const eventType = Object.keys(event)[0];
      // TODO: support more event types
      if (eventType === 'http' || eventType === 'https' ) {
        const apiResource = this.provider.getHttpApiResource(event.http || event.https, funcObject, eventType);
        const apiName = apiResource.Properties.ApiName;
        _.merge(resources, { [apiName]: apiResource });
      } else if (eventType === 'oss') {
        const triggerResource = this.provider.getOSSTriggerResource(event.oss, funcObject);
        const triggerName = triggerResource.Properties.triggerName;
        _.merge(resources, { [triggerName]: triggerResource });
      } else if (eventType === 'timer') {
        const triggerResource = this.provider.getTimerTriggerResource(
          event.timer,
          funcObject
        );
        const triggerName = triggerResource.Properties.triggerName;
        _.merge(resources, { [triggerName]: triggerResource });
      }
    });
  }
};

function needsApiGateway(event) {
  return Object.keys(event)[0] === 'http' || Object.keys(event)[0] === 'https';
}

function needsOSSTrigger(event) {
  return Object.keys(event)[0] === 'oss';
}
