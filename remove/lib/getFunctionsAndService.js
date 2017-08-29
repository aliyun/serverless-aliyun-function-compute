'use strict';

const BbPromise = require('bluebird');

module.exports = {
  getFunctionsAndService() {
    this.fcService = undefined;
    this.fcFunctions = [];

    return BbPromise.bind(this)
      .then(this.getService)
      .then(this.getFunctions);
  },

  getService() {
    const serviceName = this.provider.getServiceName();
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
  }
};
