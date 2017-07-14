'use strict';

const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const BbPromise = require('bluebird');

module.exports = {
  setupFunctions() {
    this.functions = _.filter(this.templates.update.Resources,
      (item) => this.provider.isFunctionType(item.Type))
      .map((item) => item.Properties);
    this.functionMap = new Map();

    return BbPromise.bind(this)
      .then(this.checkExistingFunctions)
      .then(this.createOrUpdateFunctions);
  },

  checkExistingFunctions() {
    return BbPromise.all(this.functions.map((func) => {
      return this.provider.getFunction(func.service, func.name)
      .then(
        (res) => this.functionMap.set(func.name, true),
        (err) => {
          if (err.code === 404) {
            return this.functionMap.set(func.name, false);
          }
          throw err;
        });
    }));
  },

  createOrUpdateFunctions() {
    return BbPromise.mapSeries(this.functions,
      (func) => this.createOrUpdateFunction(func));
  },

  createOrUpdateFunction(func) {
    if (this.functionMap.get(func.name)) {
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
  }
};
