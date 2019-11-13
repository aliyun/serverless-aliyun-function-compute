'use strict';

module.exports = {
  async removeFunctionsAndService() {
    this.serverless.cli.log('Removing functions...');
    const execRoleName = this.provider.getExecRoleName();
    this.logProjectSpec = this.templates.create.Resources[this.provider.getLogProjectId()].Properties;
    this.logStoreSpec = this.templates.create.Resources[this.provider.getLogStoreId()].Properties;
    this.logIndexSpec = this.templates.create.Resources[this.provider.getLogIndexId()].Properties;
    const slsProjectName = this.logProjectSpec.projectName;
    const slsLogStoreName = this.logStoreSpec.storeName;
    await this.removeFunctions();
    await this.removeServiceIfExists();
    await this.removeRoleAndPolicies(execRoleName);
    await this.removeLogProject(slsProjectName, slsLogStoreName);
  },

  async removeFunctions() {
    if (!this.fcFunctions.length) {
      this.serverless.cli.log(`No functions to remove.`);
      return;
    }

    const serviceName = this.fcService.serviceName;
    for (var i = 0; i < this.fcFunctions.length; i++) {
      const func = this.fcFunctions[i];
      const funcName = func.functionName;
      this.serverless.cli.log(`Removing function ${funcName} of service ${serviceName}...`);
      await this.provider.deleteFunction(serviceName, funcName);
      this.serverless.cli.log(`Removed function ${funcName} of service ${serviceName}`);
    }
  },

  async removeServiceIfExists() {
    if (!this.fcService) {
      this.serverless.cli.log(`No services to remove.`);
      return;
    }
    const serviceName = this.fcService.serviceName;
    this.serverless.cli.log(`Removing service ${serviceName}...`);
    await this.provider.deleteService(serviceName);
    this.serverless.cli.log(`Removed service ${serviceName}`);
  },
};
