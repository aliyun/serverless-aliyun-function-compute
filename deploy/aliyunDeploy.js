'use strict';

const BbPromise = require('bluebird');
const path = require('path');

const validate = require('../shared/validate');
const utils = require('../shared/utils');
const loadTemplates = require('./lib/loadTemplates');
const setupService = require('./lib/setupService');
const uploadArtifacts = require('./lib/uploadArtifacts');
const setupFunctions = require('./lib/setupFunctions');
const setupEvents = require('./lib/setupEvents');
const setupRole = require('./lib/setupRole');

class AliyunDeploy {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.provider = this.serverless.getProvider('aliyun');

    Object.assign(
      this,
      validate,
      utils,
      loadTemplates,
      setupService,
      uploadArtifacts,
      setupFunctions,
      setupEvents,
      setupRole);

    this.hooks = {
      'before:deploy:deploy': () => BbPromise.bind(this)
        .then(this.validate)
        .then(this.setDefaults)
        .then(this.loadTemplates),

      'deploy:deploy': () => BbPromise.bind(this)
        .then(this.setupService)
        .then(this.uploadArtifacts)
        .then(this.setupFunctions)
        .then(this.setupEvents)
    };
  }
}

module.exports = AliyunDeploy;
