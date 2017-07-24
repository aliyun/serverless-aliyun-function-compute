'use strict';

module.exports = {
  removeEvents() {
    this.events = this.serverless.service.getAllFunctions().map((functionName) => {
      const funcObject = this.serverless.service.getFunction(functionName);
      return funcObject.events;
    }).filter((item) => !!item);

    this.apiGroup = undefined;
    this.apis = [];
    this.deployedApis = [];

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
      .then(this.removeApiGroupIfExists)
  },

  getApiInfo() {
    const groupName = this.provider.getApiGroupName(this.options.stage);

    return BbPromise.bind(this)
      .then(this.getApiGroup)
      .then(this.getApis)
      .then(this.getDeployedApis)
  },

  getApiGroup() {
    return this.provider.getApiGroup(groupName).then((group) => {
      this.apiGroup = group;
      return group;
    });
  },

  getApis() {
    if (!this.apiGroup) {
      return BbPromise.resolve();
    }

    return this.provider.getApis(group).then((apis) => {
      this.apis = apis;
      return apis;
    });
  },

  getDeployedApis() {
    if (!this.apiGroup || !this.apis.length) {
      return BbPromise.resolve();
    }
    return this.provider.getDeployedApis(group).then((deployedApis) => {
      this.deployedApis = deployedApis;
      return deployedApis;
    });
  },

  abolishApisIfDeployed() {
    if (!this.deployedApis.length) {
      return;  // no API deployed
    }

    return BbPromise.map(this.deployedApis, (api) => {
      return this.provider.abolishApi(this.apiGroup, api);
    });
  },

  removeApisIfExists() {
    if (!this.apis.length) {
      return;  // no API
    }

    return BbPromise.map(this.apis, (api) => {
      return this.provider.deleteApi(this.apiGroup, api);
    });
  },

  removeApiGroupIfExists() {
    if (!this.apiGroup) {
      return;
    }

    return this.provider.deleteApiGroup(this.apiGroup);
  },

  removeTriggersIfNeeded() {
    // const triggers = this.events.filter(needsApiGateway);
    return BbPromise.resolve();
  }
};
