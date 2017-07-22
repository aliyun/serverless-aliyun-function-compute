"use strict";

const BbPromise = require('bluebird');

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
      'before:invoke:invoke': () => BbPromise.bind(this)
        .then(this.validate)
        .then(this.setDefaults),

      'invoke:invoke': () => BbPromise.bind(this)
        .then(this.invokeFunction),
    };
  }
}

module.exports = AliyunInvoke;