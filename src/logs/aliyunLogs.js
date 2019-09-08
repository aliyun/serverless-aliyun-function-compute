'use strict';

const validate = require('../shared/validate');
const utils = require('../shared/utils');
const retrieveLogs = require('./lib/retrieveLogs');

class AliyunLogs {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.provider = this.serverless.getProvider('aliyun');

    Object.assign(
      this,
      validate,
      utils,
      retrieveLogs
    );

    this.hooks = {
      'before:logs:logs': async () => {
        this.validate();
        this.setDefaults();
      },

      'logs:logs': async () => {
        await this.retrieveLogs();
      },
    };
  }
}

module.exports = AliyunLogs;
