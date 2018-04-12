'use strict';

const BbPromise = require('bluebird');

const validate = require('../shared/validate');
const utils = require('../shared/utils');
const displayServiceInfo = require('./lib/displayServiceInfo');

class AliyunInfo {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.provider = this.serverless.getProvider('aliyun');

    Object.assign(
      this,
      validate,
      utils,
      displayServiceInfo
    );

    this.hooks = {
      'before:info:info': () => BbPromise.bind(this)
        .then(this.validate)
        .then(this.setDefaults),

      // 'deploy:deploy': () => BbPromise.bind(this)
      //   .then(this.displayServiceInfo),

      'info:info': () => BbPromise.bind(this)
        .then(this.displayServiceInfo),
    };
  }
}

module.exports = AliyunInfo;
