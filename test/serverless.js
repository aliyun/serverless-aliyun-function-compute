'use strict';

const fs = require('fs');

const getFuncName = Symbol('getfuncname');

process.env.ALIYUN_ACCOUNT = 'ttt';

// mock of the serverless instance
class Serverless {
  constructor() {
    const sls = this;
    this.providers = {};
    this.service = {};
    this.service.getAllFunctions = function () { //eslint-disable-line
      return Object.keys(this.functions);
    };
    this.service.getFunction = function (functionName) { //eslint-disable-line
      // NOTE the stage is always 'dev'!
      if (!this.functions[functionName]) {
        throw new Error(`Function "${functionName}" doesn't exist in this Service`);
      }
      this.functions[functionName]
        .name = sls.pluginManager[getFuncName](functionName);
      return this.functions[functionName];
    };
    this.utils = {
      writeFileSync() {},
      readFileSync(path) {
        return JSON.parse(fs.readFileSync(path, 'utf8'));
      },
    };

    this.cli = {
      log() {},
      consoleLog() {},
      printDot() {},
    };
    this.plugins = [];
    this.pluginManager = {
      addPlugin: plugin => this.plugins.push(plugin),
      spawn(key) {
        if (key === 'package:function') {
          const func = this.cliOptions.function;
          sls.cli.log(`Packaging function: ${func}...`)
          sls.service.functions[func].artifact = `${func}.zip`;
        }
      },
      setCliOptions(options) {
        this.cliOptions = options;
      },
      [getFuncName](func) {
        const service = sls.service.service;
        const stage = this.cliOptions.stage;
        // const stage = this.cliOptions ? this.cliOptions.stage : 'dev';
        return `${service}-${stage}-${func}`;
      }
    };
  }  

  setProvider(name, provider) {
    this.providers[name] = provider;
  }

  getProvider(name) {
    return this.providers[name];
  }
}

module.exports = Serverless;
