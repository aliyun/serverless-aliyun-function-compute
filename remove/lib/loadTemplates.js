'use strict';

const path = require('path');

module.exports = {
  async loadTemplates(provider) {
    const createFilePath = path.join(provider.serverless.config.servicePath,
      '.serverless', 'configuration-template-create.json');
    const updateFilePath = path.join(provider.serverless.config.servicePath,
      '.serverless', 'configuration-template-update.json');

      provider.templates = {
      create: provider.serverless.utils.readFileSync(createFilePath),
      update: provider.serverless.utils.readFileSync(updateFilePath)
    };
  }
};
