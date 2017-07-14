'use strict';

const BbPromise = require('bluebird');
const path = require('path');

const validate = require('../shared/validate');
const utils = require('../shared/utils');
const setupService = require('./lib/setupService');
const uploadArtifacts = require('./lib/uploadArtifacts');
const setupFunctions = require('./lib/setupFunctions');
const setupTriggers = require('./lib/setupTriggers');

class AliyunDeploy {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.provider = this.serverless.getProvider('aliyun');

    const createFilePath = path.join(this.serverless.config.servicePath,
      '.serverless', 'configuration-template-create.json');
    const updateFilePath = path.join(this.serverless.config.servicePath,
      '.serverless', 'configuration-template-update.json');

    this.templates = {
      create: this.serverless.utils.readFileSync(createFilePath),
      update: this.serverless.utils.readFileSync(updateFilePath)
    };

    Object.assign(
      this,
      validate,
      utils,
      setupService,
      uploadArtifacts,
      setupFunctions,
      setupTriggers);

    this.hooks = {
      'before:deploy:deploy': () => BbPromise.bind(this)
        .then(this.validate)
        .then(this.setDefaults),

      'deploy:deploy': () => BbPromise.bind(this)
        .then(this.setupService)
        .then(this.uploadArtifacts)
        .then(this.setupFunctions)
        .then(this.setupTriggers)
    };
  }
}

module.exports = AliyunDeploy;
