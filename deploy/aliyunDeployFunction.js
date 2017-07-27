"use strict";

const BbPromise = require('bluebird');
const _ = require('lodash');

const validate = require('../shared/validate');
const utils = require('../shared/utils');
const prepareDeployment = require('../package/lib/prepareDeployment');
const mergeServiceResources = require('../package/lib/mergeServiceResources');
const generateArtifactDirectoryName = require('../package/lib/generateArtifactDirectoryName');
const compileFunction = require('../package/lib/compileFunctions');

const setupService = require('./lib/setupService');
const uploadArtifacts = require('./lib/uploadArtifacts');
const setupFunctions = require('./lib/setupFunctions');
const setupEvents = require('./lib/setupEvents');

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
      generateArtifactDirectoryName,
      compileFunction,
      mergeServiceResources,
      setupService,
      uploadArtifacts,
      setupFunctions,
      setupEvents
    );

    this.hooks = {
      'deploy:function:initialize': () => BbPromise.bind(this)
        .then(this.validate)
        .then(this.setDefaults),

      'deploy:function:packageFunction': () => BbPromise.bind(this)
        .then(() =>
          this.serverless.pluginManager.spawn('package:function')),

      'deploy:function:deploy': () => BbPromise.bind(this)
        .then(this.prepareDeployment)
        .then(this.generateArtifactDirectoryName)
        .then(function initializeTemplates() {
          this.templates = {
            create: this.serverless.service.provider.compiledConfigurationTemplate
          };
        })
        .then(function compileFunction() {
          const funcName = this.options.function;
          const funcObject = this.serverless.service.getFunction(funcName);
          return this.compileFunction(funcName, funcObject);
        })
        .then(this.mergeServiceResources)
        .then(function updateTemplates() {
          this.templates.update = this.serverless.service.provider.compiledConfigurationTemplate;
        })
        .then(this.setupService)
        .then(this.uploadArtifacts)
        .then(this.setupFunctions)
        .then(this.setupEvents)
    };
  }
}

module.exports = AliyunDeployFunction;