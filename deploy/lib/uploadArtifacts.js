'use strict';

const fs = require('fs');

module.exports = {
  uploadArtifacts() {
    const objectId = this.provider.getStorageObjectId();
    const object = this.templates.update.Resources[objectId].Properties;
    const bucket = this.templates.create.Resources[this.provider.getStorageBucketId()].Properties;

    this.serverless.cli.log(`Uploading ${object.ObjectName} to OSS bucket ${bucket.BucketName}...`);
    return this.provider.uploadObject(object.ObjectName, object.LocalPath).then(() => {
      this.serverless.cli.log(`Uploaded ${object.ObjectName} to OSS bucket ${bucket.BucketName}`);
    });
  }
};
