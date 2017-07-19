'use strict';

const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const BbPromise = require('bluebird');

module.exports = {
  setupTriggers() {
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
      .then(this.createApiPolicyIfNotExists)
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
          return foundGroup;
        }
        return this.createApiGroup(group);
      });
  },

  createApiGroup(group) {
    return this.provider.createApiGroup(group)
      .then((createdGroup) => {
        this.apiGroup = createdGroup;
        return createdGroup;
      });
  },

  createApiRoleIfNotExists() {
    const roleResource = this.templates.update.Resources[this.provider.getApiRoleLogicalId()];

    if (!roleResource) {
      return BbPromise.resolve();  // No API needed
    }

    const role = roleResource.Properties;
    return this.provider.getApiRole(role.RoleName)
      .then((foundRole) => {
        if (foundRole) {
          this.apiRole = foundRole;
          return foundRole;
        }
        return this.provider.createApiRole(role)
          .then((createdRole) => {
            this.apiRole = createdRole;
            return createdRole;
          });
      });
  },

  createApiPolicyIfNotExists() {
    const roleResource = this.templates.update.Resources[this.provider.getApiRoleLogicalId()];

    if (!roleResource) {
      return BbPromise.resolve();  // No API needed
    }

    const role = roleResource.Properties;

    return this.provider.getPolicies(role).then((policies) => {
      return BbPromise.map(role.Policies, (policyProps) => {
        const policy = policies.find(
          (item) => item.PolicyName === policyProps.PolicyName
        );
        if (policy) return policy;
        return this.provider.createPolicy(policyProps);
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
      return this.provider.updateApi(group, role, apiProps)
        .then((newApi) => {
          this.serverless.cli.log(`Updated API ${api.ApiName}.`);
        }, (err) => {
          this.serverless.cli.log(`Failed to update API ${api.ApiName}!`);
          throw err;
        });
    } else {
      return this.provider.createApi(group, role, api)
        .then((newApi) => {
          this.serverless.cli.log(`Created API ${api.ApiName}.`);
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
      return this.provider.deployApi(group, apiProps).then(
      () => {
        this.serverless.cli.log(`Deployed API ${api.ApiName}...`);
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
