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
    this.triggers = [];
    // TODO(joyeecheung): OSS triggers
    // this.triggers = ...?

    return BbPromise.bind(this)
      .then(this.createApisIfNeeded)
      .then(this.createTriggersIfNeeded);
  },

  createApisIfNeeded() {
    if (!this.apis.length) {
      return BbPromise.resolve();
    }
    return BbPromise.bind(this)
      .then(this.createApiGroupIfNotExists)
      .then(this.createApiRoleIfNotExists)
      .then(this.attachApiPolicyIfNotExists)
      .then(this.checkExistingApis)
      .then(this.createOrUpdateApis)
      .then(this.deployApis);
  },

  createTriggersIfNeeded() {
    if (!this.triggers.length) {
      return BbPromise.resolve();
    }
    return BbPromise.bind(this)
      .then(this.createTriggerRoleIfNotExists)
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

  createApiRoleIfNotExists() {
    const roleResource = this.templates.update.Resources[this.provider.getInvokeRoleLogicalId()];

    if (!roleResource) {
      return BbPromise.resolve();  // No API needed
    }

    const role = roleResource.Properties;
    return this.provider.getRole(role.RoleName)
      .then((foundRole) => {
        if (foundRole) {
          this.apiRole = foundRole;
          this.serverless.cli.log(`RAM role ${role.RoleName} exists.`);
          return foundRole;
        }

        this.serverless.cli.log(`Creating RAM role ${role.RoleName}...`);
        return this.provider.createRole(role)
          .then((createdRole) => {
            this.serverless.cli.log(`Created RAM role ${role.RoleName}`);
            this.apiRole = createdRole;
            return createdRole;
          });
      });
  },

  attachApiPolicyIfNotExists() {
    const roleResource = this.templates.update.Resources[this.provider.getInvokeRoleLogicalId()];

    if (!roleResource) {
      return BbPromise.resolve();  // No API needed
    }

    const role = roleResource.Properties;

    return this.provider.getPoliciesForRole(role.RoleName).then((policies) => {
      return BbPromise.map(role.Policies, (policyProps) => {
        const policyName = policyProps.PolicyName;
        const roleName = policyProps.RoleName;
        const policy = policies.find(
          (item) => item.PolicyName === policyName
        );
        if (policy) {
          this.serverless.cli.log(`RAM policy ${policyName} exists.`);
          return policy;
        }
        this.serverless.cli.log(`Attaching RAM policy ${policyName} to ${roleName}...`);
        return this.provider.attachPolicyToRole(policyProps).then((attachedPolicy) => {
          this.serverless.cli.log(`Attached RAM policy ${policyName} to ${roleName}`);
          return attachedPolicy;
        });
      })
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
    const role = this.apiRole;
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

  createTriggerRoleIfNotExists() {
    return BbPromise.reject('Not implemented');
  },

  createOrUpdateTriggers() {
    return BbPromise.reject('Not implemented');
  }
};
