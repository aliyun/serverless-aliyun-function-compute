'use strict';
const BbPromise = require('bluebird');

module.exports = {
  removeEvents() {
    this.events = this.serverless.service.getAllFunctions().map((functionName) => {
      const funcObject = this.serverless.service.getFunction(functionName);
      return funcObject.events;
    }).filter((item) => !!item);

    this.apiGroup = undefined;
    this.apis = [];
    this.deployedApis = [];
    this.apiRole = undefined;
    this.apiPolicies = [];

    this.serverless.cli.log('Removing events...');
    return BbPromise.bind(this)
      .then(this.removeApisIfNeeded)
      .then(this.removeTriggersIfNeeded);
  },

  removeApisIfNeeded() {
    return BbPromise.bind(this)
      .then(this.getApiInfo)
      .then(this.abolishApisIfDeployed)
      .then(this.removeApisIfExists)
      .then(this.getRamInfo)
      .then(this.removeApiPolicyIfExists)
      .then(this.removeApiRoleIfExists)
      .then(this.removeApiGroupIfExists)
  },

  getApiInfo() {
    return BbPromise.bind(this)
      .then(this.getApiGroup)
      .then(this.getApis)
      .then(this.getDeployedApis)
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

  getRamInfo() {
    return BbPromise.bind(this)
      .then(this.getApiRole)
      .then(this.getApiPolicies);
  },

  getApiRole() {
    const roleName = this.provider.getInvokeRoleName();
    return this.provider.getRole(roleName)
      .then((foundRole) => {
        this.apiRole = foundRole;
      });
  },

  getApiPolicies() {
    if (!this.apiRole) {
      return;
    }
    const roleName = this.provider.getInvokeRoleName();
    return this.provider.getPoliciesForRole(roleName)
      .then((policies) => {
        this.apiPolicies = policies;
      });
  },

  removeApiPolicyIfExists() {
    if (!this.apiRole || !this.apiPolicies.length) {
        return;
    }
    const role = this.apiRole;
    const roleName = this.apiRole.RoleName;
    return BbPromise.map(this.apiPolicies, (policyProps) => {
      const policyName = policyProps.PolicyName;
      this.serverless.cli.log(`Detaching RAM policy ${policyName} from ${roleName}...`);
      return this.provider.detachPolicyFromRole(role, policyProps).then(() => {
        this.serverless.cli.log(`Detached RAM policy ${policyName} from ${roleName}`);
        return;
      });
    })
  },

  removeApiRoleIfExists() {
    if (!this.apiRole) {
        return;
    }
    const roleName = this.apiRole.RoleName;
    this.serverless.cli.log(`Removing RAM role ${roleName}...`);
    return this.provider.deleteRole(roleName)
      .then(() => {
        this.serverless.cli.log(`Removed RAM role ${roleName}`);
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
    // const triggers = this.events.filter(needsApiGateway);
    return BbPromise.resolve();
  }
};
