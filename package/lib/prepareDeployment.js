'use strict';

/* eslint no-use-before-define: 0 */

const path = require('path');

const _ = require('lodash');
const BbPromise = require('bluebird');

module.exports = {
  prepareDeployment() {
    let deploymentTemplate = this.serverless.service.provider.compiledConfigurationTemplate;

    deploymentTemplate = this.serverless.utils.readFileSync(
      path.join(
        __dirname,
        '..',
        'templates',
        'core-configuration-template.json'));

    const name = this.serverless.service.provider.deploymentBucketName;
    const bucketId = this.provider.getStorageBucketId();
    deploymentTemplate.resources[bucketId].name = name;
    const objectId = this.provider.getStorageObjectId();
    deploymentTemplate.resources[objectId].bucket = name;

    this.serverless.service.provider.compiledConfigurationTemplate = deploymentTemplate;

    return BbPromise.resolve();
  },
};
