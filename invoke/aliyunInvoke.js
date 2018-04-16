'use strict';

const validate = require('../shared/validate');
const utils = require('../shared/utils');
const invokeFunction = require('./lib/invokeFunction');

class AliyunInvoke {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.provider = this.serverless.getProvider('aliyun');

    Object.assign(
      this,
      validate,
      utils,
      invokeFunction
    );

    this.hooks = {
      'before:invoke:invoke': async () => {
        await this.validate();
        this.setDefaults();
      },

      'invoke:invoke': async () => {
        await this.invokeFunction();
      },
    };
  }
}

module.exports = AliyunInvoke;
