'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');

const BbPromise = require('bluebird');
const _ = require('lodash');
const FCClient = require('@alicloud/fc');

const constants = {
  providerName: 'aliyun',
};

class AliyunProvider {
  static getProviderName() {
    return constants.providerName;
  }

  constructor(serverless) {
    this.serverless = serverless;
    this.provider = this;
    this.serverless.setProvider(constants.providerName, this);
  }

  get client() {
    if (this.__client) {
      return this.__client;
    }
    let credentials = this.serverless.provider.credentials;
    const credParts = credentials.split(path.sep);

    if (credParts[0] === '~') {
      credParts[0] = os.homedir();
      credentials = credParts.reduce((memo, part) => path.join(memo, part), '');
    }

    const keyFileContent = fs.readFileSync(credentials).toString();
    const key = JSON.parse(keyFileContent);

    this.__client = new FCClient(key.account_id, {
      accessKeyID: key.addcess_key_id,
      accessKeySecret: key.access_key_secret,
      region: key.region,
    });
    return this.__client;
  }

  getStorageBucketId() {
    return "sls-storage-bucket";
  }

  getStorageObjectId() {
    return "sls-storage-object";
  }

  getServiceId() {
    return "sls-function-service";
  }

  getServiceName(stage) {
    return `${this.serverless.service.service}-${stage}`;
  }

  getApiGroupLogicalId() {
    return "sls-api-group";
  }

  getApiGroupName(stage) {
    return `${this.getServiceName(stage)}-api`;
  }

  getApiGroup(agName) {
    return BbPromise.resolve({
      id: undefined,
      domain: undefined,
      name: agName
    });
  }

  getFunctionLogicalId(name) {
    return `sls-${name}`;
  }

  getHttpApiId(eventType, funcName) {
    return `sls-${eventType}-${funcName}`
  }

  // http://doxmate.cool/aliyun/fc-nodejs-sdk/api.html

  createService(serviceName, options) {
    return this.client.createService(serviceName, options);
  }

  getService(serviceName) {
    return this.client.getService(serviceName, options);
  }

  createFunction(serviceName, options) {
    return this.client.createFunction(serviceName, options);
  }

  getFunction(serviceName, functionName) {
    return this.client.getFunction(serviceName, functionName);
  }

  updateFunction(serviceName, functionName, options) {
    return this.client.createFunction(serviceName, functionName, options);
  }

  deleteFunction(serviceName, functionName) {
    return this.client.deleteFunction(serviceName, functionName);
  }

  invokeFunction(serviceName, functionName, event) {
    return this.client.invokeFunction(serviceName, functionName);
  }

  createTrigger(serviceName, functionName, options) {
    return this.client.createTrigger(serviceName, functionName, options);
  }

  getTrigger(serviceName, functionName, triggerName) {
    return this.client.getTrigger(serviceName, functionName, triggerName);
  }

  updateTrigger(serviceName, functionName, triggerName, options) {
    return this.client.createTrigger(serviceName, functionName, triggerName, options);
  }

  deleteTrigger(serviceName, functionName, triggerName) {
    return this.client.deleteTrigger(serviceName, functionName, triggerName);
  }
}

module.exports = AliyunProvider;
