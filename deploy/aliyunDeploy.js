'use strict';

const BbPromise = require('bluebird');

const validate = require('../shared/validate');
const utils = require('../shared/utils');
const createOrUpdateService = require('./lib/createOrUpdateService');
const createOrUpdateFunctions = require('./lib/createOrUpdateFunctions');
const uploadArtifacts = require('./lib/uploadArtifacts');
const updateDeployment = require('./lib/updateDeployment');

class AliyunDeploy {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.provider = this.serverless.getProvider('aliyun');

    Object.assign(
      this,
      validate,
      utils,
      uploadArtifacts,
      updateDeployment);

    this.hooks = {
      'before:deploy:deploy': () => BbPromise.bind(this)
        .then(this.validate)
        .then(this.setDefaults),

      'deploy:deploy': () => BbPromise.bind(this)
        .then(this.createOrUpdateService)
        .then(this.uploadArtifacts)
        .then(this.createOrUpdateFunctions)
    };
  }
}

module.exports = AliyunDeploy;
