'use strict';

const cleanupServerlessDir = require('./lib/cleanupServerlessDir');
const validate = require('../shared/validate');
const utils = require('../shared/utils');
const prepareDeployment = require('./lib/prepareDeployment');
const saveCreateTemplateFile = require('./lib/writeFilesToDisk');
const mergeServiceResources = require('./lib/mergeServiceResources');
const compileFunctions = require('./lib/compileFunctions');
const saveUpdateTemplateFile = require('./lib/writeFilesToDisk');
const { hooksWrap } = require('../shared/visitor');

class AliyunPackage {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.provider = this.serverless.getProvider('aliyun');

    Object.assign(
      this,
      cleanupServerlessDir,
      validate,
      utils,
      prepareDeployment,
      saveCreateTemplateFile,
      compileFunctions,
      mergeServiceResources,
      saveUpdateTemplateFile);

    this.hooks = hooksWrap({
      'package:cleanup': async () => {
        // TODO: change to async method
        this.cleanupServerlessDir();
      },

      'before:package:initialize': async () => {
        this.validate();
        this.setDefaults();
      },

      'package:initialize': async () => {
        await this.prepareDeployment();
        this.saveCreateTemplateFile();
      },

      'package:compileFunctions': async () => {
        this.compileFunctions();
      },

      'package:finalize': async () => {
        this.mergeServiceResources();
        this.saveUpdateTemplateFile();
        // TODO(joyeecheung): move the artifact to the path
        // specified by --package
        this.serverless.cli.log('Finished Packaging.');
      },
    }, 'package');
  }
}

module.exports = AliyunPackage;
