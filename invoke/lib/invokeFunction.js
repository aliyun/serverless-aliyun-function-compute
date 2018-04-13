'use strict';

const BbPromise = require('bluebird');
const util = require('util');

module.exports = {
  invokeFunction() {
    return BbPromise.bind(this)
      .then(this.invoke)
      .then(this.printResult, this.handleError);
  },

  invoke() {
    const serviceName = this.provider.getServiceName();
    const func = this.options.function;
    const funcObject = this.serverless.service.getFunction(func);
    const functionName = funcObject.name;

    let data;
    if (this.options.path) {
      data = this.getDataFromPath(this.options.path);
    } else if (this.options.data) {
      data = this.getDataFromInput(this.options.data);
    }
    let displayedData = '';
    if (data !== undefined) {
      displayedData = ' with ' + util.inspect(data);
      if (displayedData.indexOf('\n') !== -1) {
        displayedData = '\n' + displayedData;
      }
    }
    this.serverless.cli.log(
      `Invoking ${functionName} of ${serviceName}${displayedData}`
    );

    return this.provider.invokeFunction(serviceName, functionName, data);
  },

  printResult(result) {
    this.serverless.cli.log(result);
    return Promise.resolve();
  },

  handleError(err) {
    this.serverless.cli.log(err);
    return Promise.resolve();
  },

  getDataFromInput(input) {
    let data;
    try {
      data = JSON.parse(input);
    } catch(e) {
      data = input;
    }
    return data;
  },

  getDataFromPath(path) {
    return this.serverless.utils.readFileSync(path);
  }
};
