'use strict';

const BbPromise = require('bluebird');
const _ = require('lodash');

module.exports = {
  setDeploymentBucketName() {
    // set a default name for the deployment bucket
    const service = this.serverless.service.service;
    const name = `sls-${service}`;

    this.serverless.service.provider.deploymentBucketName = name;
    return BbPromise.resolve();
  },
};
