'use strict';

const BbPromise = require('bluebird');
const _ = require('lodash');

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
      'deploy:function:initialize': () => BbPromise.bind(this)
        .then(this.validate)
        .then(this.setDefaults),
      // .then(this.setDefaults)  // TODO: verify this.options.function

      'deploy:function:packageFunction': () => BbPromise.bind(this)
        .then(this.packageFunction)
        .then(this.compileTemplates),

      'deploy:function:deploy': () => BbPromise.bind(this)
        .then(this.setupService)
        .then(this.uploadArtifacts)
        .then(this.setupFunctions)
        .then(this.setupEvents)
    };
  }

  packageFunction() {
    return this.serverless.pluginManager.spawn('package:function');
  }

  compileTemplates() {
    return BbPromise.bind(this)
      .then(this.prepareDeployment)
      .then(this.initializeTemplates)
      .then(this.compileFunctionToTemplate)
      .then(this.mergeServiceResources)
      .then(this.updateTemplates);
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
