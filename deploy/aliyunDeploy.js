'use strict';

const validate = require('../shared/validate');
const utils = require('../shared/utils');
const loadTemplates = require('./lib/loadTemplates');
const setupService = require('./lib/setupService');
const uploadArtifacts = require('./lib/uploadArtifacts');
const setupFunctions = require('./lib/setupFunctions');
const setupEvents = require('./lib/setupEvents');
const setupRole = require('./lib/setupRole');
const { hooksWrap } = require('../shared/visitor');

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

    this.hooks = hooksWrap({
      'before:deploy:deploy': async () => {
        await this.validate();
        this.setDefaults();
        await this.loadTemplates();
      },

      'deploy:deploy': async () => {
        await this.setupService();
        await this.uploadArtifacts();
        await this.setupFunctions();
        await this.setupEvents();
      }
    }, 'deploy');
  }
}

module.exports = AliyunDeploy;
