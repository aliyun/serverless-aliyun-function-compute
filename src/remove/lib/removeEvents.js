'use strict';

module.exports = {
  async removeEvents() {
    this.apiGroup = undefined;
    this.apis = [];
    this.deployedApis = [];
    this.triggers = [];

    this.serverless.cli.log('Removing events...');
    await this.removeApisIfNeeded();
    await this.removeTriggersIfNeeded();
    await this.removeInvokeRole();
  },

  removeInvokeRole() {
    const invokeRoleName = this.provider.getInvokeRoleName();
    return this.removeRoleAndPolicies(invokeRoleName);
  },

  async removeApisIfNeeded() {
    await this.getApiInfo();
    await this.abolishApisIfDeployed();
    await this.removeApisIfExists();
    await this.removeApiGroupIfExists();
  },

  async getApiInfo() {
    await this.getApiGroup();
    await this.getApis();
    await this.getDeployedApis();
  },

  async getApiGroup() {
    const groupName = this.provider.getApiGroupName();
    this.apiGroup = await this.provider.getApiGroup(groupName);
  },

  async getApis() {
    if (!this.apiGroup) {
      return;
    }
    const groupId = this.apiGroup.GroupId;

    this.apis = await this.provider.getApis({ GroupId:  groupId});
  },

  async getDeployedApis() {
    if (!this.apiGroup || !this.apis.length) {
      return;
    }
    const groupId = this.apiGroup.GroupId;
    this.deployedApis = await this.provider.getDeployedApis({ GroupId: groupId });
  },

  async abolishApisIfDeployed() {
    if (!this.deployedApis.length) {
      this.serverless.cli.log(`No deployed APIs to abolish.`);
      return;  // no API deployed
    }

    for (var i = 0; i < this.deployedApis.length; i++) {
      const api = this.deployedApis[i];
      this.serverless.cli.log(`Abolishing API ${api.ApiName}...`);
      await this.provider.abolishApi(this.apiGroup, api);
      this.serverless.cli.log(`Abolished API ${api.ApiName}`);
    }
  },

  async removeApisIfExists() {
    if (!this.apis.length) {
      this.serverless.cli.log(`No APIs to remove.`);
      return;  // no API
    }

    for (var i = 0; i < this.apis.length; i++) {
      const api = this.apis[i];
      this.serverless.cli.log(`Removing API ${api.ApiName}...`);
      await this.provider.deleteApi(this.apiGroup, api);
      this.serverless.cli.log(`Removed API ${api.ApiName}`);
    }
  },

  async removeApiGroupIfExists() {
    if (!this.apiGroup) {
      this.serverless.cli.log(`No API groups to remove.`);
      return;
    }

    const groupName = this.apiGroup.GroupName;
    this.serverless.cli.log(`Removing API group ${groupName}...`);
    await this.provider.deleteApiGroup(this.apiGroup);
    this.serverless.cli.log(`Removed API group ${groupName}`);
  },

  async removeTriggersIfNeeded() {
    if (!this.fcService || !this.fcFunctions.length) {
      this.serverless.cli.log(`No triggers to remove.`);
      return;
    }

    const serviceName = this.fcService.serviceName;
    for (var i = 0; i < this.fcFunctions.length; i++) {
      const func = this.fcFunctions[i];
      const functionName = func.functionName;
      const triggers = await this.provider.listTriggers(serviceName, functionName);
      await this.removeTriggers(serviceName, functionName, triggers);
    }
  },

  async removeTriggers(serviceName, functionName, triggers) {
    for (var i = 0; i < triggers.length; i++) {
      const trigger = triggers[i];
      const triggerName = trigger.triggerName;
      this.serverless.cli.log(`Removing trigger ${triggerName}...`);
      await this.provider.deleteTrigger(serviceName, functionName, triggerName);
      this.serverless.cli.log(`Removed trigger ${triggerName}`);
    }
  }
};
