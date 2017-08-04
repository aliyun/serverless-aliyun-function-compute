'use strict';

/* eslint no-use-before-define: 0 */

const path = require('path');

const _ = require('lodash');
const BbPromise = require('bluebird');

module.exports = {
  prepareDeployment() {
    this.provider.initializeTemplate();
    const deploymentTemplate = this.serverless.service.provider.compiledConfigurationTemplate;

    const bucketName = this.provider.getDeploymentBucketName();
    const bucketId = this.provider.getStorageBucketId();
    deploymentTemplate.Resources[bucketId] = this.provider.getStorageBucketResource();
    const serviceId = this.provider.getServiceId();
    deploymentTemplate.Resources[serviceId] = this.provider.getServiceResource();

    const execRoleId = this.provider.getExecRoleLogicalId();deploymentTemplate.Resources[execRoleId] = this.provider.getExecRoleResource();

    this.serverless.service.provider.compiledConfigurationTemplate = deploymentTemplate;

    return BbPromise.resolve();
  },
};
