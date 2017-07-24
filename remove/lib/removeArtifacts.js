'use strict';

const BbPromise = require('bluebird');

module.exports = {
  removeArtifacts() {
    this.bucket = undefined;
    this.objects = [];
    return BbPromise.bind(this)
      .then(this.getObjectsToRemove)
      .then(this.removeObjects)
      .then(this.removeBucket);
  },

  getObjectsToRemove() {
    const bucketName = this.serverless.service.provider.deploymentBucketName;
    return this.provider.getBucket(bucketName).then((bucket) => {
      this.bucket = bucket;
      if (bucket) {
        this.provider.resetOssClient(bucketName);
        return this.provider.listObjects().then((objects) => {
          this.objects = objects;
        });
      }
    });
  },

  removeObjects() {
    if (!this.objects.length) return BbPromise.resolve();
    this.serverless.cli.log('Removing artifacts in deployment bucket...');
    const names = this.objects.map((obj) => obj.name);
    return this.provider.deleteObjects(names);
  },

  removeBucket() {
    const bucketName = this.serverless.service.provider.deploymentBucketName;
    if (!this.bucket) return BbPromise.resolve();
    this.serverless.cli.log('Removing deployment bucket');
    return this.provider.deleteBucket(bucketName);
  },
};
