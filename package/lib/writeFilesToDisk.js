'use strict';

/* eslint no-use-before-define: 0 */

const path = require('path');

const BbPromise = require('bluebird');

module.exports = {
  saveCreateTemplateFile() {
    const packagePath = 
      path.join(this.serverless.config.servicePath || '.', '.serverless');
    const filePath = path.join(packagePath,'configuration-template-create.json');

    this.serverless.utils.writeFileSync(filePath,
      this.serverless.service.provider.compiledConfigurationTemplate);

    return BbPromise.resolve();
  },

  saveUpdateTemplateFile() {
    const packagePath = 
      path.join(this.serverless.config.servicePath || '.', '.serverless');
    const filePath = path.join(packagePath, 'configuration-template-update.json');

    this.serverless.utils.writeFileSync(filePath,
      this.serverless.service.provider.compiledConfigurationTemplate);

    return BbPromise.resolve();
  },
};
