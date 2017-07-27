'use strict';

const chalk = require('chalk');
const BbPromise = require('bluebird');
const _ = require('lodash');

module.exports = {
  displayServiceInfo() {
    this.fcService = undefined;
    this.fcFunctions = [];
    this.apiGroup = undefined;
    this.apis = [];

    return BbPromise.bind(this)
      .then(this.getService)
      .then(this.getFunctions)
      .then(this.getApiInfo)
      .then(this.gatherData)
      .then(this.printInfo);
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
  },

  getApiInfo() {
    return BbPromise.bind(this)
      .then(this.getApiGroup)
      .then(this.getApis)
      .then(this.getVerboseApiInfo)
  },

  getApiGroup() {
    const groupName = this.provider.getApiGroupName();
    return this.provider.getApiGroup(groupName).then((group) => {
      this.apiGroup = group;
      return group;
    });
  },

  getApis() {
    if (!this.apiGroup) {
      return BbPromise.resolve();
    }
    const groupId = this.apiGroup.GroupId;

    return this.provider.getApis({GroupId:  groupId}).then((apis) => {
      this.apis = apis;
      return apis;
    });
  },

  getVerboseApiInfo() {
    if (!this.apiGroup || !this.apis.length) {
      return BbPromise.resolve();
    }

    return BbPromise.map(this.apis, (api, index) => {
      return this.provider.getApi(this.apiGroup, api).then((verboseApi) => {
        Object.assign(this.apis[index], verboseApi);
      })
    });
  },

  gatherData() {
    const data = {};
    data.service = this.serverless.service.service;
    data.stage = this.options.stage;
    data.region = this.options.region;
    return BbPromise.resolve(data);
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
        message += `  ${method} ${protocol}://${domain}${path}\n`
      });
    } else {
      message += 'There are no endpoints yet\n';
    }

    this.serverless.cli.consoleLog(message);

    return BbPromise.resolve();
  },
};
