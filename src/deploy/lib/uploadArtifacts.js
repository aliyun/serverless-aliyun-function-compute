'use strict';

module.exports = {
  async uploadArtifacts() {
    const objectId = this.provider.getStorageObjectId();
    const object = this.templates.update.Resources[objectId].Properties;
    const bucket = this.templates.create.Resources[this.provider.getStorageBucketId()].Properties;

    this.serverless.cli.log(`Uploading ${object.ObjectName} to OSS bucket ${bucket.BucketName}...`);
    await this.provider.uploadObject(object.ObjectName, object.LocalPath);
    this.serverless.cli.log(`Uploaded ${object.ObjectName} to OSS bucket ${bucket.BucketName}`);
  }
};
