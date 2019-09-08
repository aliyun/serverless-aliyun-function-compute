'use strict';

const path = require('path');

module.exports = {
  async loadTemplates() {
    const createFilePath = path.join(this.serverless.config.servicePath,
      '.serverless', 'configuration-template-create.json');
    const updateFilePath = path.join(this.serverless.config.servicePath,
      '.serverless', 'configuration-template-update.json');

    this.templates = {
      create: this.serverless.utils.readFileSync(createFilePath),
      update: this.serverless.utils.readFileSync(updateFilePath)
    };
  }
};
