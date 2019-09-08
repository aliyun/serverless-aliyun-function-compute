'use strict';

const chalk = require('chalk');
const _ = require('lodash');

module.exports = {
  async retrieveLogs() {
    this.logs = [];

    const data = await this.getLogs();
    this.displayLogs(data);
  },

  async getLogs() {
    const projectName = this.provider.getLogProjectName();
    const storeName = this.provider.getLogStoreName();
    const functionName = this.serverless.service.getFunction(this.options.function).name;
    const count = this.options.count;

    this.logs = await this.provider.getLogsIfAvailable(projectName, storeName, 1, { functionName }, count);
    return this.logs;
  },

  displayLogs(data) {
    let message = '';
    const service = this.serverless.service.service;
    const stage = this.options.stage;
    const region = this.options.region;

    // get all the service related information
    message += `${chalk.yellow.underline('Service Information')}\n`;
    message += `${chalk.yellow('service:')} ${service}\n`;
    message += `${chalk.yellow('stage:')} ${stage}\n`;
    message += `${chalk.yellow('region:')} ${region}\n`;

    message += '\n';

    // get all the functions
    message += `${chalk.yellow.underline('Logs')}\n`;
    if (this.logs.length) {
      const grouped = _.groupBy(this.logs, 'functionName');

      _.forEach(grouped, (logs, functionName) => {
        const serviceName = logs[0].serviceName;
        const func = `${serviceName}/${functionName}`;
        message += `  ${chalk.yellow(func)}\n`;
        logs.forEach((log) => {
          const time = new Date(parseInt(log.__time__) * 1000);
          message += `  - ${time.toISOString()}: ${log.message}\n`;
        });
      });
    } else {
      message += 'There are no logs to show\n';
    }

    this.serverless.cli.consoleLog(message);
  },
};
