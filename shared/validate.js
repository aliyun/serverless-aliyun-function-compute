'use strict';

const BbPromise = require('bluebird');
const _ = require('lodash');

module.exports = {
  validate() {
    return BbPromise.bind(this)
      .then(this.validateServicePath)
      .then(this.validateServiceName)
      .then(this.validateHandlers);
  },

  validateApiGroupName() {
    // characters, digits, underscores
  },

  validateApiName() {
    // characters, digits, underscores
  },

  validateBucketName() {
    // characters, digits, dashes
  },

  validateServicePath() {
    if (!this.serverless.config.servicePath) {
      throw new Error('This command can only be run inside a service directory');
    }
    return BbPromise.resolve();
  },

  validateServiceName() {
    const serviceName = this.serverless.service.service;
    if (!/^[a-zA-Z_][a-zA-Z0-9\-_]*$/.test(serviceName)) {
      throw new Error(
        `The name of your service ${serviceName} is invalid. A service` +
        ' name should consist only of letters, digits, underscores and' +
        ' dashes, and it can not start with digits or underscores');
    }
    if (serviceName.length > 128) {
      throw new Error(
        `The name of your service ${serviceName} is invalid. A service` +
        ' name should not be longer than 128 characters');
    }
    return BbPromise.resolve();
  },

  validateHandlers() {
    const functions = this.serverless.service.functions;
    _.forEach(functions, (funcVal, funcKey) => {
      if (!/^[a-zA-Z_][a-zA-Z0-9\-_]*$/.test(funcKey)) {
        throw new Error(
          `The name of your function ${funcKey} is invalid. A function` +
          ' name should consist only of letters, digits, underscores and' +
          ' dashes, and it can not start with digits or underscores');
      }
      if (funcKey.length > 128) {
        throw new Error(
          `The name of your function ${funcKey} is invalid. A function` +
          ' name should not be longer than 128 characters');
      }

      if (!/^[^.]+\.[^.]+$/.test(funcVal.handler)) {
        const errorMessage = [
          `The "handler" property for the function "${funcKey}" is invalid.`,
          ' Handlers should be specified like ${fileName}.${funcName}',
          ' Please check the docs for more info.',
        ].join('');
        throw new Error(errorMessage);
      }
    });
    return BbPromise.resolve();
  },
};
