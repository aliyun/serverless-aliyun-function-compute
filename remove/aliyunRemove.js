"use strict";

const BbPromise = require('bluebird');

const validate = require('../shared/validate');
const utils = require('../shared/utils');

class AliyunRemove {
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
      // 'before:remove:remove': () => BbPromise.bind(this)
      //   .then(this.validate)
      //   .then(this.setDefaults)
      //   .then(this.setDeploymentBucketName),

      // 'remove:remove': () => BbPromise.bind(this)
      //   .then(this.emptyDeploymentBucket)
      //   .then(this.removeDeployment),
    };
  }
}

module.exports = AliyunRemove;