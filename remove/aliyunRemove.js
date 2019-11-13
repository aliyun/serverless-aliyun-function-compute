'use strict';

const validate = require('../shared/validate');
const utils = require('../shared/utils');
const getFunctionsAndService = require('./lib/getFunctionsAndService');
const removeEvents = require('./lib/removeEvents');
const removeFunctionsAndService = require('./lib/removeFunctionsAndService');
const removeArtifacts = require('./lib/removeArtifacts');
const removeRoleAndPolicies = require('./lib/removeRoleAndPolicies');
const serviceTemplate = require('./lib/loadTemplates');
const removeLogProject = require('./lib/removeLogProject');
const { hooksWrap } = require('../shared/visitor');

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
      removeLogProject,
      removeFunctionsAndService,
      removeArtifacts,
      removeRoleAndPolicies
    );

    this.hooks = hooksWrap({
      'before:remove:remove': async () => {
        this.validate();
        this.setDefaults();
        await serviceTemplate.loadTemplates(this);
      },

      'remove:remove': async () => {
        await this.getFunctionsAndService();
        await this.removeEvents();
        await this.removeFunctionsAndService();
        await this.removeArtifacts();
      }
    }, 'remove');
  }
}

module.exports = AliyunRemove;
