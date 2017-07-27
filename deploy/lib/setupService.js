'use strict';

const fs = require('fs');
const path = require('path');

const BbPromise = require('bluebird');

module.exports = {
  setupService() {
    return BbPromise.bind(this)
      .then(this.checkForExistingService)
      .then(this.createServiceIfNotExists)
      .then(this.createBucketIfNotExists);
  },

  updateServiceId(id) {
    const serviceKey = this.provider.getServiceId();
    const createService = this.templates.create.Resources[serviceKey].Properties;
    const updateService = this.templates.update.Resources[serviceKey].Properties;
    updateService.id = id;
    createService.id = id;
  },

  checkForExistingService() {
    const service = this.templates.create.Resources[this.provider.getServiceId()].Properties;

    return this.provider.getService(service.name);
  },

  createServiceIfNotExists(foundService) {
    const service = this.templates.create.Resources[this.provider.getServiceId()].Properties;

    if (foundService) {
      this.updateServiceId(foundService.serviceId);
      this.serverless.cli.log(`Service ${service.name} already exists.`);
      return BbPromise.resolve();
    }

    this.serverless.cli.log(`Creating service ${service.name}...`);
    // TODO(joyeecheung): generate description
    return this.provider.createService(service.name)
      .then((createdService) => {
        // Update existing service id
        this.updateServiceId(createdService.serviceId);
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
