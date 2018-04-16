'use strict';

const _ = require('lodash');

module.exports = {
  async setupEvents() {
    this.apis = _.filter(
      this.templates.update.Resources,
      (item) => this.provider.isApiType(item.Type))
      .map((item) => item.Properties);
    this.triggers = _.filter(
      this.templates.update.Resources,
      (item) => this.provider.isTriggerType(item.Type))
      .map((item) => item.Properties);

    await this.setupInvokeRole();
    await this.createApisIfNeeded();
    await this.createTriggersIfNeeded();
  },

  async setupInvokeRole() {
    const role = this.templates.update.Resources[this.provider.getInvokeRoleLogicalId()].Properties;
    // TODO: update if needed
    this.invokeRole = await this.setupRole(role);
  },

  async createApisIfNeeded() {
    if (!this.apis.length) {
      return;
    }

    await this.createApiGroupIfNotExists();
    await this.checkExistingApis();
    await this.createOrUpdateApis();
    await this.deployApis();
  },

  async createTriggersIfNeeded() {
    if (!this.triggers.length) {
      return;
    }

    await this.checkExistingTriggers();
    await this.createOrUpdateTriggers();
  },

  async createApiGroupIfNotExists() {
    const groupResource = this.templates.update.Resources[this.provider.getApiGroupLogicalId()];
    if (!groupResource) {
      return; // No API needed
    }

    const group = groupResource.Properties;
    const groupName = group.GroupName;

    const foundGroup = await this.provider.getApiGroup(groupName);
    if (foundGroup) {
      this.apiGroup = foundGroup;
      this.serverless.cli.log(`API group ${group.GroupName} exists.`);
      return foundGroup;
    }

    await this.createApiGroup(group);
  },

  async createApiGroup(group) {
    this.serverless.cli.log(`Creating API group ${group.GroupName}...`);
    const createdGroup = await this.provider.createApiGroup(group);
    this.apiGroup = createdGroup;
    this.serverless.cli.log(`Created API group ${group.GroupName}`);
    return createdGroup;
  },

  async checkExistingApis() {
    if (!this.apis.length) {
      return;
    }

    const apis = await this.provider.getApis({
      GroupId: this.apiGroup.GroupId
    });
    this.apiMap = new Map(apis.map((api) => [api.ApiName, api]));
    this.apis.forEach((api) => {
      if (!this.apiMap.get(api.ApiName)) {
        this.apiMap.set(api.ApiName, false);
      }
    });
  },

  async createOrUpdateApis() {
    if (!this.apis.length) {
      return;
    }

    for (var i = 0; i < this.apis.length; i++) {
      const api = this.apis[i];
      await this.createOrUpdateApi(api);
    }
  },

  async createOrUpdateApi(api) {
    const group = this.apiGroup;
    const role = this.invokeRole;
    const apiInMap = this.apiMap.get(api.ApiName);
    if (apiInMap) {
      const apiProps = Object.assign({ApiId: apiInMap.ApiId}, api);
      this.serverless.cli.log(`Updating API ${api.ApiName}...`);
      try {
        await this.provider.updateApi(group, role, apiProps);
        this.serverless.cli.log(`Updated API ${api.ApiName}`);
      } catch (err) {
        this.serverless.cli.log(`Failed to update API ${api.ApiName}!`);
        throw err;
      }
      return;
    }

    this.serverless.cli.log(`Creating API ${api.ApiName}...`);
    let newApi;
    try {
      newApi = await this.provider.createApi(group, role, api);
    } catch (err) {
      this.serverless.cli.log(`Failed to create API ${api.ApiName}!`);
      throw err;
    }
    this.serverless.cli.log(`Created API ${api.ApiName}`);
    this.apiMap.set(api.ApiName, newApi);
  },

  async deployApis() {
    const group = this.apiGroup;
    for (var i = 0; i < this.apis.length; i++) {
      const api = this.apis[i];
      const apiProps = this.apiMap.get(api.ApiName);
      this.serverless.cli.log(`Deploying API ${api.ApiName}...`);
      try {
        await this.provider.deployApi(group, apiProps);
        this.serverless.cli.log(`Deployed API ${api.ApiName}`);
        const config = api.RequestConfig;
        const func = api.ServiceConfig.FunctionComputeConfig;
        this.serverless.cli.log(`${config.RequestHttpMethod} ` +
        `http://${this.apiGroup.SubDomain}${config.RequestPath} -> ` +
        `${func.ServiceName}.${func.FunctionName}`);
      } catch (err) {
        this.serverless.cli.log(`Failed to deploy API ${api.ApiName}!`);
        throw err;
      }
    }
  },

  async checkExistingTriggers() {
    this.triggerMap = new Map();
    for (var i = 0; i < this.triggers.length; i++) {
      const trigger = this.triggers[i];
      const foundTrigger = await this.provider.getTrigger(
        trigger.serviceName, trigger.functionName, trigger.triggerName
      );
      if (foundTrigger) {
        this.triggerMap.set(trigger.triggerName, foundTrigger);
      }
    }
  },

  async createOrUpdateTriggers() {
    if (!this.triggers.length) {
      return;
    }

    for (var i = 0; i < this.triggers.length; i++) {
      const trigger = this.triggers[i];
      await this.createOrUpdateTrigger(trigger);
    }
  },

  async createOrUpdateTrigger(trigger) {
    const role = this.invokeRole;
    const triggerName = trigger.triggerName;
    const serviceName = trigger.serviceName;
    const functionName = trigger.functionName;
    const triggerInMap = this.triggerMap.get(triggerName);
    if (triggerInMap) {
      this.serverless.cli.log(`Updating trigger ${triggerName}...`);
      try {
        await this.provider.updateTrigger(serviceName, functionName, triggerName, trigger, role);
        this.serverless.cli.log(`Updated trigger ${triggerName}`);
      } catch (err) {
        this.serverless.cli.log(`Failed to update trigger ${triggerName}!`);
        throw err;
      }
      return;
    }

    this.serverless.cli.log(`Creating trigger ${triggerName}...`);
    try {
      const newtrigger = await this.provider.createTrigger(serviceName, functionName, trigger, role);
      this.serverless.cli.log(`Created trigger ${triggerName}`);
      this.triggerMap.set(triggerName, newtrigger);
    } catch (err) {
      this.serverless.cli.log(`Failed to create trigger ${triggerName}!`);
      throw err;
    }
  }
};
