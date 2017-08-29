'use strict';

const fs = require('fs');
const path = require('path');

const BbPromise = require('bluebird');

module.exports = {
  setupService() {
    this.logProjectSpec = this.templates.create.Resources[this.provider.getLogProjectId()].Properties;
    this.logStoreSpec = this.templates.create.Resources[this.provider.getLogStoreId()].Properties;
    this.logIndexSpec = this.templates.create.Resources[this.provider.getLogIndexId()].Properties;

    this.logProject = undefined;
    this.logStore = undefined;
    this.logIndex = undefined;

    return BbPromise.bind(this)
      .then(this.createLogConfigIfNotExists)
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

  createLogConfigIfNotExists() {
    return BbPromise.bind(this)
      .then(this.createLogProjectIfNotExists)
      .then(this.createLogStoreIfNotExists)
      .then(this.createLogIndexIfNotExists)
  },

  createLogProjectIfNotExists() {
    const projectName = this.logProjectSpec.projectName;
    return this.provider.getLogProject(projectName)
      .then((logProject) => {
        if (logProject) {
          this.serverless.cli.log(`Log project ${projectName} already exists.`);
          this.logProject = logProject;
          return;
        }

        this.serverless.cli.log(`Creating log project ${projectName}...`);
        return this.provider.createLogProject(projectName, this.logProjectSpec)
          .then((createdProject) => {
            this.serverless.cli.log(`Created log project ${projectName}`);
            this.logProject = createdProject;
          });
      });
  },

  createLogStoreIfNotExists() {
    if (!this.logProject) {
      return;
    }
    const projectName = this.logProjectSpec.projectName;
    const storeName = this.logStoreSpec.storeName;
    return this.provider.getLogStore(projectName, storeName)
      .then((logStore) => {
        if (logStore) {
          this.serverless.cli.log(`Log store ${projectName}/${storeName} already exists.`);
          this.logStore = logStore;
          return;
        }

        this.serverless.cli.log(`Creating log store ${projectName}/${storeName}...`);
        return this.provider.createLogStore(projectName, storeName, this.logStoreSpec)
          .then((createdStore) => {
            this.serverless.cli.log(`Created log store ${projectName}/${storeName}`);
            this.logStore = createdStore;
          });
      });
  },

  createLogIndexIfNotExists() {
    if (!this.logProject || !this.logStore) {
      return;
    }
    const projectName = this.logProjectSpec.projectName;
    const storeName = this.logStoreSpec.storeName;
    return this.provider.getLogIndex(projectName, storeName)
      .then((logIndex) => {
        if (logIndex) {
          this.serverless.cli.log(`Log store ${projectName}/${storeName} already has an index.`);
          this.logIndex = logIndex;
          return;
        }

        this.serverless.cli.log(`Creating log index for ${projectName}/${storeName}...`);
        return this.provider.createLogIndex(projectName, storeName, this.logIndexSpec)
          .then((createdIndex) => {
            this.serverless.cli.log(`Created log index for ${projectName}/${storeName}`);
            this.logIndex = createdIndex;
          });
      });
  },

  checkForExistingService() {
    const service = this.templates.create.Resources[this.provider.getServiceId()].Properties;

    return this.provider.getService(service.name);
  },

  createServiceIfNotExists(foundService) {
    const service = this.templates.create.Resources[this.provider.getServiceId()].Properties;

    if (foundService) {
      this.serverless.cli.log(`Service ${service.name} already exists.`);
      return BbPromise.resolve();
    }

    this.serverless.cli.log(`Creating service ${service.name}...`);
    // TODO(joyeecheung): generate description
    // TODO(joyeecheung): update service
    const spec = Object.assign({
      role: this.execRole.Arn
    }, service);
    return this.provider.createService(service.name, spec)
      .then((createdService) => {
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
