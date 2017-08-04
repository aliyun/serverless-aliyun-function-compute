'use strict';

const fs = require('fs');
const path = require('path');

const BbPromise = require('bluebird');

module.exports = {
  setupService() {
    return BbPromise.bind(this)
      // .then(this.checkForExistingLogStore)
      // .then(this.createLogStoreIfNotExists)
      .then(this.setupExecRole)
      .then(this.checkForExistingService)
      .then(this.createServiceIfNotExists)
      .then(this.createBucketIfNotExists);
  },

  setupExecRole() {
    const role = this.templates.create.Resources[this.provider.getExecRoleLogicalId()].Properties;
    return BbPromise.bind(this)
      .then(() => this.setupRole(role))
      .then((execRole) => this.execRole = execRole)
  },

  checkForExistingService() {
    const service = this.templates.create.Resources[this.provider.getServiceId()].Properties;

    return this.provider.getService(service.name);
  },

  createServiceIfNotExists(foundService) {
    const service = this.templates.create.Resources[this.provider.getServiceId()].Properties;

    if (foundService) {
      this.serverless.cli.log(`Service ${service.name} already exists.`);
      // TODO(joyeecheung): check if role and log is configured
      return BbPromise.resolve();
    }

    this.serverless.cli.log(`Creating service ${service.name}...`);
    // TODO(joyeecheung): generate description
    return this.provider.createService(service.name, this.execRole).then((createdService) => {
        this.serverless.cli.log(`Created service ${service.name}`);
      });
  },

  createBucketIfNotExists() {
    const bucket = this.templates.create.Resources[this.provider.getStorageBucketId()].Properties;

    return this.provider.getBucket(bucket.BucketName)
      .then((foundBucket) => {
        if (foundBucket) { 
          this.serverless.cli.log(`Bucket ${bucket.BucketName} already exists.`);
          return foundBucket;
        }
        this.serverless.cli.log(`Creating bucket ${bucket.BucketName}...`);
        return this.provider.createBucket(bucket.BucketName)
          .then(() => {
            this.serverless.cli.log(`Created bucket ${bucket.BucketName}`);
          });
    }).then((foundBucket) => {
      this.provider.resetOssClient(bucket.BucketName);
    });
  }
};
