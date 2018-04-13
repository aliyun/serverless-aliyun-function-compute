'use strict';

const BbPromise = require('bluebird');

module.exports = {
  removeFunctionsAndService() {
    this.serverless.cli.log('Removing functions...');
    const execRoleName = this.provider.getExecRoleName();
    return BbPromise.bind(this)
      .then(this.removeFunctions)
      .then(this.removeServiceIfExists)
      .then(() => this.removeRoleAndPolicies(execRoleName));
  },

  removeFunctions() {
    if (!this.fcFunctions.length) {
      this.serverless.cli.log(`No functions to remove.`);
      return Promise.resolve();
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
      return Promise.resolve();
    }
    const serviceName = this.fcService.serviceName;
    this.serverless.cli.log(`Removing service ${serviceName}...`);
    return this.provider.deleteService(serviceName).then(() => {
      this.serverless.cli.log(`Removed service ${serviceName}`);
    });
  },
};
