'use strict';

const BbPromise = require('bluebird');

module.exports = {
  removeArtifacts() {
    this.bucket = undefined;
    this.objects = [];
    return BbPromise.bind(this)
      .then(this.getBucket)
      .then(this.getObjectsToRemove)
      .then(this.removeObjects)
      .then(this.removeBucket);
  },

  getBucket() {
    const bucketName = this.provider.getDeploymentBucketName();
    return this.provider.getBucket(bucketName).then((bucket) => {
      this.bucket = bucket;
    });
  },

  getObjectsToRemove() {
    if (!this.bucket) {return BbPromise.resolve();}
    const bucketName = this.bucket.name;
    this.provider.resetOssClient(bucketName);
    const prefix = this.provider.getArtifactDirectoryPrefix();
    return this.provider.getObjects({ prefix }).then((objects) => {
      this.objects = objects;
    });
  },

  removeObjects() {
    if (!this.objects.length) {
      this.serverless.cli.log(`No artifacts to remove.`);
      return BbPromise.resolve();
    }

    const bucketName = this.bucket.name;
    const names = this.objects.map((obj) => obj.name);
    this.serverless.cli.log(`Removing ${names.length} artifacts in OSS bucket ${bucketName}...`);
    return this.provider.deleteObjects(names).then(() => {
      this.serverless.cli.log(`Removed ${names.length} artifacts in OSS bucket ${bucketName}`);
    });
  },

  removeBucket() {
    if (!this.bucket) {
      this.serverless.cli.log(`No buckets to remove.`);
      return BbPromise.resolve();
    }

    const bucketName = this.bucket.name;
    this.serverless.cli.log(`Removing OSS bucket ${bucketName}...`);
    return this.provider.deleteBucket(bucketName).then(() => {
      this.serverless.cli.log(`Removed OSS bucket ${bucketName}`);
    });
  },
};
