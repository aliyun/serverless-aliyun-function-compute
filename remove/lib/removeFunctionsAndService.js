'use strict';

const BbPromise = require('bluebird');

module.exports = {
  removeFunctionsAndService() {
    this.fcService = undefined;
    this.fcFunctions = [];
    this.serverless.cli.log('Removing functions...');
    return BbPromise.bind(this)
      .then(this.getService)
      .then(this.getFunctions)
      .then(this.removeFunctions)
      .then(this.removeServiceIfExists);
  },

  getService() {
    const serviceName = this.provider.getServiceName(this.options.stage);
    return this.provider.getService(serviceName).then((service) => {
      this.fcService = service;
    });
  },

  getFunctions() {
    if (!this.fcService) {
      return BbPromise.resolve();
    }
    const serviceName = this.fcService.serviceName;
    return this.provider.getFunctions(serviceName).then((functions) => {
      this.fcFunctions = functions;
    });
  },

  removeFunctions() {
    if (!this.fcFunctions.length) {
      this.serverless.cli.log(`No functions to remove.`);
      return BbPromise.resolve();
    }

    const serviceName = this.fcService.serviceName;
    return BbPromise.mapSeries(this.fcFunctions, (func) => {
      const funcName = func.functionName;
      this.serverless.cli.log(`Removing function ${funcName} of service ${serviceName}...`);
      return this.provider.deleteFunction(serviceName, funcName).then(() => {
        this.serverless.cli.log(`Removed function ${funcName} of service ${serviceName}`);
      });
    });
  },

  removeServiceIfExists() {
    if (!this.fcService) {
      this.serverless.cli.log(`No services to remove.`);
      return BbPromise.resolve();
    }
    const serviceName = this.fcService.serviceName;
    this.serverless.cli.log(`Removing service ${serviceName}...`);
    return this.provider.deleteService(serviceName).then(() => {
      this.serverless.cli.log(`Removed service ${serviceName}`);
    });
  }
};
