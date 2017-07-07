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

    const bucketName = this.serverless.service.provider.deploymentBucketName;
    const bucketId = this.provider.getStorageBucketId();
    deploymentTemplate.Resources[bucketId].Properties.BucketName = bucketName;
    deploymentTemplate.Resources[bucketId].Properties.Region = `${this.options.region}`;

    const serviceId = this.provider.getServiceId();
    deploymentTemplate.Resources[serviceId].Properties.region = this.options.region;

    this.serverless.service.provider.compiledConfigurationTemplate = deploymentTemplate;

    return BbPromise.resolve();
  },
};
