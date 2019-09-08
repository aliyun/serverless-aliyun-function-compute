'use strict';

module.exports = {
  async getFunctionsAndService() {
    this.fcService = undefined;
    this.fcFunctions = [];

    await this.getService();
    await this.getFunctions();
  },

  async getService() {
    const serviceName = this.provider.getServiceName();
    this.fcService = await this.provider.getService(serviceName);
  },

  async getFunctions() {
    if (!this.fcService) {
      return;
    }
    const serviceName = this.fcService.serviceName;
    this.fcFunctions = await this.provider.getFunctions(serviceName);
  }
};
