'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const ini = require('ini');
const co = require('co');

const BbPromise = require('bluebird');
const _ = require('lodash');
const FCClient = require('@alicloud/fc');
const oss = require('ali-oss');
const AGClient = function(){}; //require('@alicloud/fc');
const utils = require('../shared/utils');

const constants = {
  providerName: 'aliyun',
};

const keySym = Symbol('key');
const fcClientSym = Symbol('fc-client');
const agClientSym = Symbol('ag-client');
const ossClientSym = Symbol('oss-client');

class AliyunProvider {
  static getProviderName() {
    return constants.providerName;
  }

  constructor(serverless, options) {
    this.serverless = serverless;
    this.provider = this;
    this.serverless.setProvider(constants.providerName, this);
    this.options = options;
    utils.setDefaults.call(this);
  }

  get key() {
    if (this[keySym]) {
      return this[keySym];
    }
    let credentials = this.serverless.provider.credentials;
    const credParts = credentials.split(path.sep);

    if (credParts[0] === '~') {
      credParts[0] = os.homedir();
      credentials = credParts.reduce((memo, part) => path.join(memo, part), '');
    }
    const keyFileContent = fs.readFileSync(credentials, 'utf-8').toString();
    // TODO(joyeecheung) support profiles other than [default]
    this[keySym] = ini.parse(keyFileContent).default;
    return this[keySym];
  }

  get fcClient() {
    if (this[fcClientSym]) {
      return this[fcClientSym];
    }

    const key = this.key;
    this[fcClientSym] = new FCClient(key.account_id, {
      accessKeyID: key.addcess_key_id,
      accessKeySecret: key.access_key_secret,
      region: this.options.region
    });
    return this[fcClientSym];
  }

  get agClient() {
    if (this[agClientSym]) {
      return this[agClientSym];
    }

    const key = this.key;
    this[agClientSym] = new AGClient(key.account_id, {
      accessKeyID: key.addcess_key_id,
      accessKeySecret: key.access_key_secret,
      region: this.options.region
    });
    return this[agClientSym];
  }

  get ossClient() {
    if (this[ossClientSym]) {
      return this[ossClientSym];
    }

    const key = this.key;
    this[ossClientSym] = oss({
      accessKeyId: key.addcess_key_id,
      accessKeySecret: key.access_key_secret,
      region: `oss-${this.options.region}`
    });
    return this[ossClientSym];
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

  getFunctionLogicalId(name) {
    return `sls-${name}`;
  }

  // If a function is going to be reused by multiple endpoints,
  // the user should create multiple functions instead
  // So the API name is identified by just
  // eventType and funcName
  getApiName(eventType, funcName) {
    return `sls-${eventType}-${funcName}`;
  }

  createBucket(bucketName, region) {
    return co(function *() {
      return yield this.ossClient.putBucket(bucketName, `oss-${region}`)
    });
  }

  // http://doxmate.cool/aliyun/fc-nodejs-sdk/api.html

  /**
   * @param {string} serviceName
   * @param {Service} options
   * @return {ServiceResponse}
   * https://help.aliyun.com/document_detail/52877.html#service
   * https://help.aliyun.com/document_detail/52877.html#serviceresponse
   */
  createService(serviceName, options) {
    return this.fcClient.createService(serviceName, options);
  }

  /**
   * @param {string} serviceName
   * @return {ServiceResponse}
   */
  getService(serviceName, region, options) {
    if (region !== this.key.region) {
      throw new Error(`The credentials are for region ${this.key.region}, ` +
        `but the service is specified to be deployed in region ${region}`);
    }
    return this.fcClient.getService(serviceName, options);
  }

  /**
   * @param {string} serviceName
   * @param {Service} options
   * @return {ServiceResponse}
   */
  updateService(serviceName, options) {
    return this.fcClient.updateService(serviceName, options);
  }

  /**
   * @param {string} serviceName
   * @param {Function} options
   * @return {FunctionResponse}
   * https://help.aliyun.com/document_detail/52877.html#function
   * https://help.aliyun.com/document_detail/52877.html#functionresponse
   */
  createFunction(serviceName, options) {
    return this.fcClient.createFunction(serviceName, options);
  }

  /**
   * @param {string} serviceName
   * @return {{ functions: Function[], nextToken: string}}
   * TODO(joyeecheung): paging
   */
  listFunction(serviceName) {
    return this.fcClient.listFunction(serviceName);
  }

  /**
   * @param {string} serviceName
   * @param {string} functionName
   * @return {FunctionResponse}
   */
  getFunction(serviceName, functionName) {
    return this.fcClient.getFunction(serviceName, functionName);
  }

  /**
   * @param {string} serviceName
   * @param {string} functionName
   * @param {Function} options
   * @return {FunctionResponse}
   */
  updateFunction(serviceName, functionName, options) {
    return this.fcClient.createFunction(serviceName, functionName, options);
  }

  /**
   * @param {string} serviceName
   * @param {string} functionName
   * @return {object}
   */
  deleteFunction(serviceName, functionName) {
    return this.fcClient.deleteFunction(serviceName, functionName);
  }

  /**
   * @param {string} serviceName
   * @param {string} functionName
   * @param {Event} event
   * @return {InvokeResponse}
   * https://help.aliyun.com/document_detail/52877.html#invokeresponse
   */
  invokeFunction(serviceName, functionName, event) {
    return this.fcClient.invokeFunction(serviceName, functionName);
  }

  /**
   * @param {string} serviceName
   * @param {string} functionName
   * @param {Trigger} trigger
   * @return {TriggerResponse}https://help.aliyun.com/document_detail/52877.html#trigger
   * https://help.aliyun.com/document_detail/52877.html#triggerresponse
   */
  createTrigger(serviceName, functionName, trigger) {
    return this.fcClient.createTrigger(serviceName, functionName, trigger);
  }

  /**
   * @param {string} serviceName
   * @param {string} functionName
   * @param {string} triggerName
   * @return {TriggerResponse}
   */
  getTrigger(serviceName, functionName, triggerName) {
    return this.fcClient.getTrigger(serviceName, functionName, triggerName);
  }

  /**
   * @param {string} serviceName
   * @param {string} functionName
   * @param {string} triggerName
   * @param {Trigger} trigger
   * @return {TriggerResponse}
   */
  updateTrigger(serviceName, functionName, triggerName, trigger) {
    return this.fcClient.createTrigger(serviceName, functionName, triggerName, trigger);
  }

  /**
   * @param {string} serviceName
   * @param {string} functionName
   * @param {string} triggerName
   * @return {}
   */
  deleteTrigger(serviceName, functionName, triggerName) {
    return this.fcClient.deleteTrigger(serviceName, functionName, triggerName);
  }

  // https://help.aliyun.com/document_detail/43595.html

  getApiGroupDesc(stage) {
    const service = this.getServiceName(stage)
    return `API group for Function Compute service ${service}, generated by ` +
           'the Serverless framework.';
  }

  getApiDesc(eventType, funcName, stage) {
    const service = this.getServiceName(stage)
    return `API for Function Compute function ${funcName} of service ` +
           `${service}, triggered by ${eventType} event, generated by the ` +
           'Serverless framework.';
  }

  /**
   * @param {string} stage
   * @return {{name: string, id: string, domain: string}}
   * https://help.aliyun.com/document_detail/43611.html
   */
  createAPIGroup(stage) {
    return this.agClient.createAPIGroup({
      GroupName: this.getApiGroupName(stage),
      Description: this.getApiGroupDesc(stage)
    }).then(toGroup);
  }

  /**
   * @param {string} groupName
   * @return {{name: string, id: string, domain: string}}
   * https://help.aliyun.com/document_detail/43616.html
   */
  getApiGroup(groupName) {
    return this.agClient.describeAPIGroups({
      GroupName: groupName,
      Description: this.getApiGroupDesc(groupName)
    }).then((res) => {
      if (res.TotalCount === 0) {
        return undefined;
      }
      const groups = res.ApiGroupAttributes.ApiGroupAttribute;
      const group = groups.find(
        (item) => item.GroupName === groupName);
      if (!group) return group;
      return toGroup(group);
    });
  }

  /**
   * TODO(joyeecheung): validation
   * @param {string} eventType 
   * @param {object} event 
   */
  getRequestConfig(eventType, event) {
    if (eventType === 'http') {
      return {
        RequestProtocol: 'HTTP',
        RequestHttpMethod: event.RequestHttpMethod || event.method.toUpperCase(),
        RequestPath: event.RequestPath || event.path,
        BodyFormat: event.BodyFormat || 'JSON'
      };
    }
    throw new Error(`unknown event type ${eventType}`);
  }

  /**
   * 
   * @param {string} groupId 
   * @param {string} eventType 
   * @param {string} funcName 
   * @param {object} event 
   * @param {string} stage 
   * https://help.aliyun.com/document_detail/43623.html
   */
  createAPI(groupId, eventType, funcName, event, stage) {
    return this.agClient.createAPI({
      GroupId: groupId,
      ApiName: this.getApiName(eventType, funcName, stage),
      Visibility: event.Visibility || 'PUBLIC',
      Description: this.getApiDesc(eventType, funcName, stage),
      AuthType: event.AuthType || 'ANONYMOUS',
      RequestParameters: event.RequestParameters || [],
      RequestConfig: this.getRequestConfig(eventType, event)
    });
  }

  getAPI(groupId, eventType, funcName) {

  }

}

function toGroup(obj) {
  return {
    name: obj.GroupName,
    id: obj.GroupId,
    domain: obj.SubDomain
  }
}


module.exports = AliyunProvider;
