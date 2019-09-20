'use strict';

const validate = require('../shared/validate');
const utils = require('../shared/utils');
const retrieveLogs = require('./lib/retrieveLogs');
const { hooksWrap } = require('../shared/visitor');

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

    this.hooks = hooksWrap({
      'before:logs:logs': async () => {
        this.validate();
        this.setDefaults();
      },

      'logs:logs': async () => {
        await this.retrieveLogs();
      },
    }, 'logs');
  }
}

module.exports = AliyunLogs;
