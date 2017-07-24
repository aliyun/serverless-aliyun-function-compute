"use strict";

const BbPromise = require('bluebird');

const validate = require('../shared/validate');
const utils = require('../shared/utils');
const removeEvents = require('./lib/removeEvents');
const removeFunctionsAndService = require('./lib/removeFunctionsAndService');
const removeArtifacts = require('./lib/removeArtifacts');
const setDeploymentBucketName = require('../shared/setDeploymentBucketName');

class AliyunRemove {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.provider = this.serverless.getProvider('aliyun');

    Object.assign(
      this,
      validate,
      utils,
      setDeploymentBucketName,
      removeEvents,
      removeFunctionsAndService,
      removeArtifacts
    );

    this.hooks = {
      'before:remove:remove': () => BbPromise.bind(this)
        .then(this.validate)
        .then(this.setDefaults)
        .then(this.setDeploymentBucketName),

      'remove:remove': () => BbPromise.bind(this)
        .then(this.removeEvents)
        .then(this.removeFunctionsAndService)
        .then(this.removeArtifacts)
    };
  }
}

module.exports = AliyunRemove;