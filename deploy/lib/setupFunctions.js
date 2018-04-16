'use strict';

const _ = require('lodash');

module.exports = {
  async setupFunctions() {
    this.functions = _.filter(this.templates.update.Resources,
      (item) => this.provider.isFunctionType(item.Type))
      .map((item) => item.Properties);
    this.functionMap = new Map();

    await this.checkExistingFunctions();
    await this.createOrUpdateFunctions();
  },

  async checkExistingFunctions() {
    return Promise.all(this.functions.map(async (func) => {
      const foundFunction = await this.provider.getFunction(func.service, func.name);
      this.functionMap.set(func.name, !!foundFunction);
    }));
  },

  async createOrUpdateFunctions() {
    for (var i = 0; i < this.functions.length; i++) {
      const func = this.functions[i];
      await this.createOrUpdateFunction(func);
    }
  },

  async createOrUpdateFunction(func) {
    if (this.functionMap.get(func.name)) {
      this.serverless.cli.log(`Updating function ${func.name}...`);
      try {
        await this.provider.updateFunction(func.service, func.name, func);
        this.serverless.cli.log(`Updated function ${func.name}`);
      } catch (err) {
        this.serverless.cli.log(`Failed to update function ${func.name}!`);
        throw err;
      }
      return;
    }
    this.serverless.cli.log(`Creating function ${func.name}...`);
    try {
      await this.provider.createFunction(func.service, func.name, func);
      this.serverless.cli.log(`Created function ${func.name}`);
    } catch (err) {
      this.serverless.cli.log(`Failed to create function ${func.name}!`);
      throw err;
    }
  }
};
