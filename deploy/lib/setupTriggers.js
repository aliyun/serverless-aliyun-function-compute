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

  checkExistingApis(group) {
    const apis = _.filter(
      this.templates.update,
      (item) => this.provider.isApiType(item.Type));
    
    if (!apis.length) {
      return { group, apis };
    }

    return BbPromise.all(this.functions.map((func) => {
      return this.provider.getFunction(func.service, func.name)
      .then(
        (res) => ({name: func.name, exists: true}),
        (err) => {
          if (err.code === 404) {
            return {name: func.name, exists: false}
          }
          throw err;
        });
    }));
  },

  createOrUpdateApis({group, apis}) {
    if (!apis.length) {
      return;
    }

    // FIXME(joyeecheung): mapSeries?
    return BbPromise.all(apis, (api, index) => {
      if (exists[index].exists) {
        return this.provider.updateFunction(func.service, func.name, func)
          .then(() => {
            this.serverless.cli.log(`Updated ${func.name}.`);
          }, (err) => {
            this.serverless.cli.log(`Failed to update ${func.name}!`);
            throw err;
          });
      } else {
        return this.provider.createFunction(func.service, func.name, func)
          .then(() => {
            this.serverless.cli.log(`Created ${func.name}.`);
          }, (err) => {
            this.serverless.cli.log(`Failed to create ${func.name}!`);
            throw err;
          });
      }
    });
  },
};
