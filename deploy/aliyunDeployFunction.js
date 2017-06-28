"use strict";

const BbPromise = require('bluebird');

const validate = require('../shared/validate');
const utils = require('../shared/utils');

class AliyunDeployFunction {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.provider = this.serverless.getProvider('aliyun');

    Object.assign(
      this,
      validate,
      utils,
    );

    this.hooks = {
      // 'deploy:function:initialize': () => BbPromise.bind(this)
      //   .then(this.validate),
      // 'deploy:function:packageFunction': () => BbPromise.bind(this)
      //   .then(this.packageFunction)
      //   .then(this.compileFunction),
      // 'deploy:function:deploy': () => BbPromise.bind(this)
      //   .then(this.deployFunction)
      //   .then(this.cleanup)
    };
  }
}

module.exports = AliyunDeployFunction;