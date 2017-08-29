'use strict';

const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const BbPromise = require('bluebird');

module.exports = {
  setupEvents() {
    this.apis = _.filter(
      this.templates.update.Resources,
      (item) => this.provider.isApiType(item.Type))
      .map((item) => item.Properties);
    this.triggers = _.filter(
      this.templates.update.Resources,
      (item) => this.provider.isTriggerType(item.Type))
      .map((item) => item.Properties);

    return BbPromise.bind(this)
      .then(this.setupInvokeRole)
      .then(this.createApisIfNeeded)
      .then(this.createTriggersIfNeeded);
  },

  setupInvokeRole() {
    const role = this.templates.update.Resources[this.provider.getInvokeRoleLogicalId()].Properties;

    // TODO: update if needed
    return BbPromise.bind(this)
      .then(() => this.setupRole(role))
      .then((invokeRole) => this.invokeRole = invokeRole);
  },

  createApisIfNeeded() {
    if (!this.apis.length) {
      return BbPromise.resolve();
    }

    return BbPromise.bind(this)
      .then(this.createApiGroupIfNotExists)
      .then(this.checkExistingApis)
      .then(this.createOrUpdateApis)
      .then(this.deployApis);
  },

  createTriggersIfNeeded() {
    if (!this.triggers.length) {
      return BbPromise.resolve();
    }

    return BbPromise.bind(this)
      .then(this.checkExistingTriggers)
      .then(this.createOrUpdateTriggers);
  },

  createApiGroupIfNotExists() {
    const groupResource = this.templates.update.Resources[this.provider.getApiGroupLogicalId()];

    if (!groupResource) {
      return BbPromise.resolve();  // No API needed
    }
    const group = groupResource.Properties;

    const groupName = group.GroupName;
    const groupDesc = group.Description;

    return this.provider.getApiGroup(groupName)
      .then((foundGroup) => {
        if (foundGroup) {
          this.apiGroup = foundGroup;
          this.serverless.cli.log(`API group ${group.GroupName} exists.`);
          return foundGroup;
        }
        return this.createApiGroup(group);
      });
  },

  createApiGroup(group) {
    this.serverless.cli.log(`Creating API group ${group.GroupName}...`);
    return this.provider.createApiGroup(group)
      .then((createdGroup) => {
        this.apiGroup = createdGroup;
          this.serverless.cli.log(`Created API group ${group.GroupName}`);
        return createdGroup;
      });
  },

  checkExistingApis() {
    if (!this.apis.length) {
      return;
    }

    return this.provider.getApis({
      GroupId: this.apiGroup.GroupId
    }).then((apis) => {
      this.apiMap = new Map(apis.map((api) => [api.ApiName, api]));
      this.apis.forEach((api) => {
        if (!this.apiMap.get(api.ApiName)) {
          this.apiMap.set(api.ApiName, false);
        }
      });
    });
  },

  createOrUpdateApis(group) {
    if (!this.apis.length) {
      return;
    }

    return BbPromise.mapSeries(this.apis,
      (api) => this.createOrUpdateApi(api));
  },

  createOrUpdateApi(api) {
    const group = this.apiGroup;
    const role = this.invokeRole;
    const apiInMap = this.apiMap.get(api.ApiName);
    if (apiInMap) {
      const apiProps = Object.assign({ApiId: apiInMap.ApiId}, api);
      this.serverless.cli.log(`Updating API ${api.ApiName}...`);
      return this.provider.updateApi(group, role, apiProps)
        .then((newApi) => {
          this.serverless.cli.log(`Updated API ${api.ApiName}`);
        }, (err) => {
          this.serverless.cli.log(`Failed to update API ${api.ApiName}!`);
          throw err;
        });
    } else {
      this.serverless.cli.log(`Creating API ${api.ApiName}...`);
      return this.provider.createApi(group, role, api)
        .then((newApi) => {
          this.serverless.cli.log(`Created API ${api.ApiName}`);
          this.apiMap.set(api.ApiName, newApi);
        }, (err) => {
          this.serverless.cli.log(`Failed to create API ${api.ApiName}!`);
          throw err;
        });
    }
  },

  deployApis() {
    const group = this.apiGroup;
    return BbPromise.mapSeries(this.apis, (api) => {
      const apiProps = this.apiMap.get(api.ApiName);
      this.serverless.cli.log(`Deploying API ${api.ApiName}...`);
      return this.provider.deployApi(group, apiProps).then(
      () => {
        this.serverless.cli.log(`Deployed API ${api.ApiName}`);
        const config = api.RequestConfig;
        const func = api.ServiceConfig.FunctionComputeConfig;
        this.serverless.cli.log(`${config.RequestHttpMethod} ` +
          `http://${this.apiGroup.SubDomain}${config.RequestPath} -> ` +
          `${func.ServiceName}.${func.FunctionName}`);
      },
      (err) => {
        this.serverless.cli.log(`Failed to deploy API ${api.ApiName}!`);
        throw err;
      });
    });
  },

  checkExistingTriggers() {
    this.triggerMap = new Map();
    return BbPromise.mapSeries(this.triggers, (trigger) => {
      return this.provider.getTrigger(
        trigger.serviceName, trigger.functionName, trigger.triggerName
      ).then((foundTrigger) => {
        if (foundTrigger) {
          this.triggerMap.set(trigger.triggerName, foundTrigger)
        }
      })
    });
  },

  createOrUpdateTriggers() {
    if (!this.triggers.length) {
      return;
    }

    return BbPromise.mapSeries(this.triggers,
      (trigger) => this.createOrUpdateTrigger(trigger));
  },

  createOrUpdateTrigger(trigger) {
    const role = this.invokeRole;
    const triggerName = trigger.triggerName;
    const serviceName = trigger.serviceName;
    const functionName = trigger.functionName;
    const triggerInMap = this.triggerMap.get(triggerName);
    if (triggerInMap) {
      this.serverless.cli.log(`Updating trigger ${triggerName}...`);
      return this.provider.updateTrigger(serviceName, functionName, triggerName, trigger, role)
        .then((newtrigger) => {
          this.serverless.cli.log(`Updated trigger ${triggerName}`);
        }, (err) => {
          this.serverless.cli.log(`Failed to update trigger ${triggerName}!`);
          throw err;
        });
    } else {
      this.serverless.cli.log(`Creating trigger ${triggerName}...`);
      return this.provider.createTrigger(serviceName, functionName, trigger, role)
        .then((newtrigger) => {
          this.serverless.cli.log(`Created trigger ${triggerName}`);
          this.triggerMap.set(triggerName, newtrigger);
        }, (err) => {
          this.serverless.cli.log(`Failed to create trigger ${triggerName}!`);
          throw err;
        });
    }
  }
};
