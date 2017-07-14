'use strict';

const fs = require('fs');

module.exports = {
  uploadArtifacts() {
    this.serverless.cli.log('Uploading artifacts...');
    const objectId = this.provider.getStorageObjectId();
    const object = this.templates.update.Resources[objectId].Properties;

    this.serverless.service.package.artifactFilePath;
    return this.provider.uploadObject(object.ObjectName, object.LocalPath);
  }
};
