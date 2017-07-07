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

  checkForExistingService() {
    const service = this.templates.create.Resources[this.provider.getServiceId()].Properties;

    return this.provider.getService(service.name, service.region)
      .catch((err) => {
        if (err.code && err.code === 404) {  // not found
          return undefined;
        }
        throw err;
      });
  },

  updateServiceId(id) {
    const serviceKey = this.provider.getServiceId();
    const createService = this.templates.create.Resources[serviceKey].Properties;
    const updateService = this.templates.update.Resources[serviceKey].Properties;
    updateService.id = id;
    createService.id = id;
  },

  createServiceIfNotExists(foundService) {
    const service = this.templates.create.Resources[this.provider.getServiceId()].Properties;

    if (foundService) {
      this.updateServiceId(foundService.serviceId);
      this.serverless.cli.log(`Service ${service.name} already exists.`);
      return BbPromise.resolve();
    }

    this.serverless.cli.log(`Creating service ${service.name}...`);
    return this.provider.createService(serviceName)
      .then((service) => {
        // Update existing service id
      this.updateServiceId(service.serviceId);
        this.serverless.cli.log(`Created service ${service.name}.`);
      });
  },

  createBucketIfNotExists(foundService) {
    const bucket = this.templates.create.Resources[this.provider.getStorageBucketId()].Properties;

    this.serverless.cli.log(`Creating bucket ${bucket.BucketName}...`);
    return this.provider.createBucket(bucket.BucketName, bucket.Region)
      .then(() => {
        this.provider.resetOssClient(bucket.BucketName);
        this.serverless.cli.log(`Created bucket ${bucket.BucketName}.`);
      }, (err) => {
        if (err.name === 'BucketAlreadyExistsError') {
          this.provider.resetOssClient(bucket.BucketName);
          this.serverless.cli.log(`Bucket ${bucket.BucketName} already exists.`);
          return undefined;
        }
        throw err;
      });
  },
};
