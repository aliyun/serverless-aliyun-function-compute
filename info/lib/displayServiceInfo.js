'use strict';

const chalk = require('chalk');

module.exports = {
  async displayServiceInfo() {
    this.fcService = undefined;
    this.fcFunctions = [];
    this.apiGroup = undefined;
    this.apis = [];

    await this.getService();
    await this.getFunctions();
    await this.getApiInfo();
    const data = this.gatherData();
    this.printInfo(data);
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
  },

  async getApiInfo() {
    await this.getApiGroup();
    await this.getApis();
    await this.getVerboseApiInfo();
  },

  async getApiGroup() {
    const groupName = this.provider.getApiGroupName();
    this.apiGroup = await this.provider.getApiGroup(groupName);
  },

  async getApis() {
    if (!this.apiGroup) {
      return;
    }
    const groupId = this.apiGroup.GroupId;

    this.apis = await this.provider.getApis({GroupId:  groupId});
  },

  async getVerboseApiInfo() {
    if (!this.apiGroup || !this.apis.length) {
      return;
    }

    return Promise.all(this.apis.map(async (api, index) => {
      const verboseApi = await this.provider.getApi(this.apiGroup, api);
      Object.assign(this.apis[index], verboseApi);
    }));
  },

  gatherData() {
    const data = {};
    data.service = this.serverless.service.service;
    data.stage = this.options.stage;
    data.region = this.options.region;
    return data;
  },

  printInfo(data) {
    let message = '';

    // get all the service related information
    message += `${chalk.yellow.underline('Service Information')}\n`;
    message += `${chalk.yellow('service:')} ${data.service}\n`;
    message += `${chalk.yellow('stage:')} ${data.stage}\n`;
    message += `${chalk.yellow('region:')} ${data.region}\n`;

    message += '\n';

    // get all the functions
    message += `${chalk.yellow.underline('Functions')}\n`;
    if (this.fcFunctions.length) {
      this.fcFunctions.forEach((func) => {
        message += `- ${chalk.yellow(func.functionName)}\n`;
        message += `  last modified: ${func.lastModifiedTime}\n`;
      });
    } else {
      message += 'There are no functions deployed yet\n';
    }

    message += `\n${chalk.yellow.underline('Endpoints')}\n`;
    if (this.apis.length) {
      message += `API Group: ${chalk.yellow(this.apiGroup.GroupName)}\n`;
      const domain = this.apiGroup.SubDomain;
      this.apis.forEach((api) => {
        const deployStatus = api.DeployedInfos.DeployedInfo[0];
        const deployed = deployStatus.DeployedStatus === 'DEPLOYED' ? 'deployed' : 'not deployed';
        const req = api.RequestConfig;
        const method = req.RequestHttpMethod;
        const protocol = req.RequestProtocol.toLowerCase();
        const path = req.RequestPath;

        message += `- ${chalk.yellow(api.ApiName)} (${deployed})\n`;
        message += `  ${method} ${protocol}://${domain}${path}\n`;
      });
    } else {
      message += 'There are no endpoints yet\n';
    }

    // TODO(joyeecheung): display triggers

    this.serverless.cli.consoleLog(message);
    return;
  },
};
