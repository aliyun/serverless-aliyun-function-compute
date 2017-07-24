'use strict';

module.exports = {
  removeFunctionsAndService() {
    this.fcService = undefined;
    this.fcFunctions = [];
    this.serverless.cli.log('Removing functions...');
    this.serviceName = this.provider.getServiceName(this.options.stage);;
    return BbPromise.bind(this)
      .then(this.getService)
      .then(this.getFunctions)
      .then(this.removeFunctions)
      .then(this.removeServiceIfExists);
  },

  getService() {
    return this.provider.getService(this.serviceName).then((service) => {
      this.fcService = service;
    })
  },

  getFunctions() {
    if (!this.fcService) {
      return BbPromise.resolve();
    }
    return this.provider.listFunctions(this.serviceName).then((functions) => {
      this.fcFunctions = functions;
    });
  },

  removeFunctions() {
    if (!this.fcFunctions.length) {
      return BbPromise.resolve();
    }

    return BbPromise.map(this.functions, (func) => {
      return this.provider.deleteFunction(this.serviceName, func.name);
    });
  },

  removeServiceIfExists() {
    if (!this.fcService) {
      return BbPromise.resolve();
    }
    return this.provider.deleteService(this.serviceName);
  }
};
