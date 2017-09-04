'use strict';
const BbPromise = require('bluebird');

module.exports = {
  removeEvents() {
    this.apiGroup = undefined;
    this.apis = [];
    this.deployedApis = [];
    this.triggers = [];

    this.serverless.cli.log('Removing events...');
    return BbPromise.bind(this)
      .then(this.removeApisIfNeeded)
      .then(this.removeTriggersIfNeeded)
      .then(this.removeInvokeRole);
  },

  removeInvokeRole() {
    const invokeRoleName = this.provider.getInvokeRoleName();
    return this.removeRoleAndPolicies(invokeRoleName);
  },

  removeApisIfNeeded() {
    return BbPromise.bind(this)
      .then(this.getApiInfo)
      .then(this.abolishApisIfDeployed)
      .then(this.removeApisIfExists)
      .then(this.removeApiGroupIfExists);
  },

  getApiInfo() {
    return BbPromise.bind(this)
      .then(this.getApiGroup)
      .then(this.getApis)
      .then(this.getDeployedApis);
  },

  getApiGroup() {
    const groupName = this.provider.getApiGroupName();
    return this.provider.getApiGroup(groupName).then((group) => {
      this.apiGroup = group;
      return group;
    });
  },

  getApis() {
    if (!this.apiGroup) {
      return BbPromise.resolve();
    }
    const groupId = this.apiGroup.GroupId;

    return this.provider.getApis({ GroupId:  groupId}).then((apis) => {
      this.apis = apis;
      return apis;
    });
  },

  getDeployedApis() {
    if (!this.apiGroup || !this.apis.length) {
      return BbPromise.resolve();
    }
    const groupId = this.apiGroup.GroupId;
    return this.provider.getDeployedApis({ GroupId: groupId }).then((deployedApis) => {
      this.deployedApis = deployedApis;
      return deployedApis;
    });
  },

  abolishApisIfDeployed() {
    if (!this.deployedApis.length) {
      this.serverless.cli.log(`No deployed APIs to abolish.`);
      return;  // no API deployed
    }

    return BbPromise.mapSeries(this.deployedApis, (api) => {
      this.serverless.cli.log(`Abolishing API ${api.ApiName}...`);
      return this.provider.abolishApi(this.apiGroup, api).then(() => {
        this.serverless.cli.log(`Abolished API ${api.ApiName}`);
      });
    });
  },

  removeApisIfExists() {
    if (!this.apis.length) {
      this.serverless.cli.log(`No APIs to remove.`);
      return;  // no API
    }

    return BbPromise.mapSeries(this.apis, (api) => {
      this.serverless.cli.log(`Removing API ${api.ApiName}...`);
      return this.provider.deleteApi(this.apiGroup, api).then(() => {
        this.serverless.cli.log(`Removed API ${api.ApiName}`);
      });
    });
  },

  removeApiGroupIfExists() {
    if (!this.apiGroup) {
      this.serverless.cli.log(`No API groups to remove.`);
      return;
    }

    const groupName = this.apiGroup.GroupName;
    this.serverless.cli.log(`Removing API group ${groupName}...`);
    return this.provider.deleteApiGroup(this.apiGroup).then(() => {
      this.serverless.cli.log(`Removed API group ${groupName}`);
    });
  },

  removeTriggersIfNeeded() {
    if (!this.fcService || !this.fcFunctions.length) {
      this.serverless.cli.log(`No triggers to remove.`);
      return BbPromise.resolve();
    }

    const serviceName = this.fcService.serviceName;
    return BbPromise.mapSeries(this.fcFunctions, (func) => {
      const functionName = func.functionName;
      return this.provider.listTriggers(serviceName, functionName)
        .then((triggers) => this.removeTriggers(serviceName, functionName, triggers));
    });
  },

  removeTriggers(serviceName, functionName, triggers) {
    return BbPromise.mapSeries(triggers, (trigger) => {
      const triggerName = trigger.triggerName;
      this.serverless.cli.log(`Removing trigger ${triggerName}...`);
      return this.provider.deleteTrigger(serviceName, functionName, triggerName)
        .then(() => {
          this.serverless.cli.log(`Removed trigger ${triggerName}`);
        });
    });
  }
};
