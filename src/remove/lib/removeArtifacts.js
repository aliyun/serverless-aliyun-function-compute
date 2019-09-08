'use strict';

module.exports = {
  async removeArtifacts() {
    this.bucket = undefined;
    this.objects = [];
    await this.getBucket();
    await this.getObjectsToRemove();
    await this.removeObjects();
    await this.removeBucket();
  },

  async getBucket() {
    const bucketName = this.provider.getDeploymentBucketName();
    this.bucket = await this.provider.getBucket(bucketName);
  },

  async getObjectsToRemove() {
    if (!this.bucket) {return;}
    const bucketName = this.bucket.name;
    this.provider.resetOssClient(bucketName);
    const prefix = this.provider.getArtifactDirectoryPrefix();
    this.objects = await this.provider.getObjects({ prefix });
  },

  async removeObjects() {
    if (!this.objects.length) {
      this.serverless.cli.log(`No artifacts to remove.`);
      return;
    }

    const bucketName = this.bucket.name;
    const names = this.objects.map((obj) => obj.name);
    this.serverless.cli.log(`Removing ${names.length} artifacts in OSS bucket ${bucketName}...`);
    await this.provider.deleteObjects(names);
    this.serverless.cli.log(`Removed ${names.length} artifacts in OSS bucket ${bucketName}`);
  },

  async removeBucket() {
    if (!this.bucket) {
      this.serverless.cli.log(`No buckets to remove.`);
      return;
    }

    const bucketName = this.bucket.name;
    this.serverless.cli.log(`Removing OSS bucket ${bucketName}...`);
    await this.provider.deleteBucket(bucketName);
    this.serverless.cli.log(`Removed OSS bucket ${bucketName}`);
  },
};
