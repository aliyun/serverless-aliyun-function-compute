'use strict';

const validate = require('../shared/validate');
const utils = require('../shared/utils');
const getFunctionsAndService = require('./lib/getFunctionsAndService');
const removeEvents = require('./lib/removeEvents');
const removeFunctionsAndService = require('./lib/removeFunctionsAndService');
const removeArtifacts = require('./lib/removeArtifacts');
const removeRoleAndPolicies = require('./lib/removeRoleAndPolicies');

class AliyunRemove {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.provider = this.serverless.getProvider('aliyun');

    Object.assign(
      this,
      validate,
      utils,
      getFunctionsAndService,
      removeEvents,
      removeFunctionsAndService,
      removeArtifacts,
      removeRoleAndPolicies
    );

    this.hooks = {
      'before:remove:remove': async () => {
        this.validate();
        this.setDefaults();
      },

      'remove:remove': async () => {
        await this.getFunctionsAndService();
        await this.removeEvents();
        await this.removeFunctionsAndService();
        await this.removeArtifacts();
      }
    };
  }
}

module.exports = AliyunRemove;
