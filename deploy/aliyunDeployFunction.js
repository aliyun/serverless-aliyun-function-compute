'use strict';

const validate = require('../shared/validate');
const utils = require('../shared/utils');
const prepareDeployment = require('../package/lib/prepareDeployment');
const mergeServiceResources = require('../package/lib/mergeServiceResources');
const compileFunction = require('../package/lib/compileFunctions');

const setupService = require('./lib/setupService');
const uploadArtifacts = require('./lib/uploadArtifacts');
const setupFunctions = require('./lib/setupFunctions');
const setupEvents = require('./lib/setupEvents');
const setupRole = require('./lib/setupRole');

class AliyunDeployFunction {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.provider = this.serverless.getProvider('aliyun');

    Object.assign(
      this,
      validate,
      utils,
      prepareDeployment,
      compileFunction,
      mergeServiceResources,
      setupService,
      uploadArtifacts,
      setupFunctions,
      setupEvents,
      setupRole
    );

    this.hooks = {
      'deploy:function:initialize': async () => {
        await this.validate();
        this.setDefaults();
        // TODO: verify this.options.function
      },

      'deploy:function:packageFunction': async () => {
        await this.packageFunction();
        await this.compileTemplates();
      },

      'deploy:function:deploy': async () => {
        await this.setupService();
        await this.uploadArtifacts();
        await this.setupFunctions();
        await this.setupEvents();
      },
    };
  }

  packageFunction() {
    return this.serverless.pluginManager.spawn('package:function');
  }

  async compileTemplates() {
    this.prepareDeployment();
    await this.initializeTemplates();
    await this.compileFunctionToTemplate();
    await this.mergeServiceResources();
    await this.updateTemplates();
  }

  initializeTemplates() {
    this.templates = {
      create: this.serverless.service.provider.compiledConfigurationTemplate
    };
  }

  compileFunctionToTemplate() {
    const funcName = this.options.function;
    const funcObject = this.serverless.service.getFunction(funcName);
    return this.compileFunction(funcName, funcObject);
  }

  updateTemplates() {
    this.templates.update = this.serverless.service.provider.compiledConfigurationTemplate;
  }
}

module.exports = AliyunDeployFunction;
