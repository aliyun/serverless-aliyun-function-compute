'use strict';

const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const BbPromise = require('bluebird');

module.exports = {
  setupFunctions() {
    const functionType = this.provider.getFunctionType();
    this.functions = _.filter(this.templates.update, (item) => item.Type = functionType);

    return BbPromise.bind(this)
      .then(this.checknewFunctions)
      .then(this.createOrUpdateFunctions);
  },

  checkExistingFunctions() {
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

  createOrUpdateFunctions(exists) {
    const existingFunctions = exists.filter((item) => item.exists)
      .map((item) => item.name);
    const newFunctions = exists.filter((item) => !item.exists)
      .map((item) => item.name);
    if (existingFunctions.length) {
      this.serverless.cli.log(`Existing functions [ ${existingFunctions.join(', ')} ] will be updated...`);
    }
    if (newFunctions.length) {
      this.serverless.cli.log(`New functions [ ${newFunctions.join(', ')} ] will be created...`);
    }

    // FIXME(joyeecheung): mapSeries?
    return BbPromise.all(this.functions, (func, index) => {
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
