'use strict';

const fs = require('fs');
const path = require('path');

const BbPromise = require('bluebird');

module.exports = {
  setupTriggers() {
    return BbPromise.bind(this)
      .then(this.createApiGroupIfNotExists)
      .then(this.checkExistingApis)
      .then(this.createOrUpdateApis);
      // .then(this.createOrUpdateTriggers); // OSS, .etc
  },

  createApiGroupIfNotExists() {
    const group = this.templates.update.Resources[this.provider.getApiGroupName(this.options.stage)];

    if (!group) {
      return BbPromise.resolve();  // No API needed
    }

    this.provider.getApiGroup(group.Properties.GroupName)
      .then(function(group) {
        if (group) { return group; }
        return this.provider.createApiGroup(group.Properties.GroupName, group.Properties.Description);
      });
  },

  createOrUpdateApis(group) {
    const apis = _.filter(
      this.templates.update,
      (item) => this.provider.isApiType(item.Type));
    
    if (!apis.length) {
      return;
    }

    // FIXME(joyeecheung): mapSeries?
    return BbPromise.all(apis,
      (api) => BbPromise.bind(this, api).then(this.createOrUpdateApi));
  },

  createOrUpdateApi(api) {
    return this.provider.createApi(api.Properties)
      .then(() => {
        this.serverless.cli.log(`Created API${api.ApiName}.`);
      }, (err) => {
        // TODO(joyeecheung) Not sure about what code this should be
        if (err.code !== 400) {
          this.serverless.cli.log(`Failed to create API ${api.ApiName}!`);
          throw err;
        }

        return this.provider.updateApi(api.Properties)
          .then(() => {
            this.serverless.cli.log(`Updated API ${api.ApiName}...`);
          }, () => {
            this.serverless.cli.log(`Failed to create API ${api.ApiName}...`);
            throw err;
          });
      });
  }
};
