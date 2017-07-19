'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const ini = require('ini');
const co = require('co');

const BbPromise = require('bluebird');
const _ = require('lodash');

const FCClient = require('@alicloud/fc');
const OSS = require('ali-oss');
const CloudAPI = function() {};
const RAM = function() {};
// const CloudAPI = require('@alicloud/cloudapi');
// const RAM = require('@alicloud/ram');

const utils = require('../shared/utils');

const constants = {
  providerName: 'aliyun',
};

const keySym = Symbol('key');
const fcClientSym = Symbol('fc-client');
const agClientSym = Symbol('ag-client');
const ossClientSym = Symbol('oss-client');
const ramClientSym = Symbol('ram-client');

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
    let credentials = this.serverless.service.provider.credentials;
    const credParts = credentials.split(path.sep);

    if (credParts[0] === '~') {
      credParts[0] = os.homedir();
      credentials = credParts.reduce((memo, part) => path.join(memo, part), '');
    }
    const keyFileContent = fs.readFileSync(credentials, 'utf-8').toString();
    // TODO(joyeecheung) support profiles other than [default]
    this[keySym] = ini.parse(keyFileContent).default;

    [
      'aliyun_account_id',
      'aliyun_access_key_id',
      'aliyun_access_key_secret'
    ].forEach((field) => {
      if (!this[keySym][field]) {
        throw new Error(`Credentials in ${credentials} does not contain ${field}`);
      }
    });

    return this[keySym];
  }

  get fcClient() {
    if (this[fcClientSym]) {
      return this[fcClientSym];
    }

    const key = this.key;
    this[fcClientSym] = new FCClient(key.aliyun_account_id, {
      accessKeyID: key.aliyun_access_key_id,
      accessKeySecret: key.aliyun_access_key_secret,
      region: this.options.region
    });
    return this[fcClientSym];
  }

  get agClient() {
    if (this[agClientSym]) {
      return this[agClientSym];
    }

    const key = this.key;
    this[agClientSym] = new CloudAPI({
      accessKeyId: key.aliyun_access_key_id,
      accessKeySecret: key.aliyun_access_key_secret,
      endpoint: `http://apigateway.${this.options.region}.aliyuncs.com`
    });
    return this[agClientSym];
  }

  get ramClient() {
    if (this[ramClientSym]) {
      return this[ramClientSym];
    }

    const key = this.key;
    this[ramClientSym] = new RAM({
      accessKeyId: key.aliyun_access_key_id,
      accessKeySecret: key.aliyun_access_key_secret,
      endpoint: 'https://ram.aliyuncs.com'
    });
    return this[ramClientSym];
  }

  get ossClient() {
    if (this[ossClientSym]) {
      return this[ossClientSym];
    }

    const key = this.key;
    this[ossClientSym] = OSS({
      accessKeyId: key.aliyun_access_key_id,
      accessKeySecret: key.aliyun_access_key_secret,
      region: `oss-${this.options.region}`
    });
    return this[ossClientSym];
  }

  resetOssClient(bucketName) {
    const key = this.key;
    this[ossClientSym] = OSS({
      accessKeyId: key.aliyun_access_key_id,
      accessKeySecret: key.aliyun_access_key_secret,
      bucket: bucketName,
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

  getApiRoleLogicalId() {
    return "sls-api-fc-invocation-role";
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

  uploadObject(objectName, filePath) {
    return co(function *() {
      return yield this.ossClient.put(objectName, filePath)
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
    return this.fcClient.getService(serviceName, options).catch((err) => {
      if (err.code === 'ServiceNotFound') return undefined;
      throw err;
    });
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
    return this.fcClient.getFunction(serviceName, functionName)
      .catch((err) => {
        if (err.code === 'FunctionNotFound') return undefined;
        throw err;
      });
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
   * @param {{GroupName: string, Description: string}} props
   * @return {APIGroupResponse}
   * https://help.aliyun.com/document_detail/43611.html
   */
  createApiGroup(props) {
    return this.agClient.createApiGroup(props);
  }

  /**
   * @param {string} roleName
   * @return {{RoleId: string, RoleName: string, Arn: string}}
   * https://help.aliyun.com/document_detail/28711.html
   */
  getApiRole(roleName) {
    return this.ramClient.getRole({
      roleName: roleName
    }).then(
      (res) => res.Role,
      (err) => {
        if (err.name === 'EntityNotExist.RoleError') return undefined;
        throw err;
      }
    );
  }

  /**
   * @param {object} role
   * @return {{RoleId: string, RoleName: string, Arn: string}}
   * https://help.aliyun.com/document_detail/28710.html 
   */
  createApiRole(role) {
    return this.ramClient.createRole({
      RoleName: role.RoleName,
      Description: role.Description,
      AssumeRolePolicyDocument: JSON.stringify(role.AssumeRolePolicyDocument)
    }).then((res) => res.Role);
  }

  getPolicies(role) {
    const roleName = role.RoleName;
    return this.ramClient.listPoliciesForRole({
      RoleName: roleName
    }).then((res) => res.Policies.Policy);
  }

  createPolicy(policy) {
    return this.ramClient.attachPolicyToRole(policy);
  }

  /**
   * @param {{GroupName: string, Description: string}} props
   * @return {{GroupId: string, GroupName: string, SubDomain: string}}
   * https://help.aliyun.com/document_detail/43611.html
   */
  createApiGroup(props) {
    return this.agClient.createApiGroup(props);
  }

  /**
   * @param {string} groupName
   * @return {{GroupId: string, GroupName: string, SubDomain: string}}
   * https://help.aliyun.com/document_detail/43616.html
   */
  getApiGroup(groupName) {
    // TODO(joyeecheung): pagination
    return this.agClient.describeAPIGroups({
      GroupName: groupName
    }).then((res) => {
      if (res.TotalCount === 0) {
        return undefined;
      }
      const groups = res.ApiGroupAttributes.ApiGroupAttribute;
      const group = groups.find(
        (item) => item.GroupName === groupName);
      return group;
    });
  }

  isApiType(type) {
    return type === "ALIYUN::API::HTTP";
  }

  isFunctionType(type) {
    return type === "ALIYUN::FC::Function";
  }

  /**
   * @param {{GroupId: string}} props 
   */
  getApis(props) {
    const query = Object.assign({}, props, { PageSize: 50 });
    return this.agClient.describeApis(query)
      .then((res) => {
        const apis = res.ApiSummarys.ApiSummary;
        if (res.TotalCount > apis.length) {
          // TODO(joyeecheung): pagination
        }
        return apis;
      });
  }

  getApiProps(group, role, api) {
    const props = Object.assign(
      { "GroupId": group.GroupId },
      _.omit(api, ['RequestConfig', 'ServiceConfig'])
    );
    props.RequestConfig = JSON.stringify(api.RequestConfig);
    props.ServiceConfig = JSON.stringify(Object.assign(
      { RoleArn: role.Arn },
      api.ServiceConfig
    ));
    return props;
  }

  /**
   * @param {object} props
   * https://help.aliyun.com/document_detail/43623.html
   */
  createApi(group, role, api) {
    const props = this.getApiProps(group, role, api);
    return this.agClient.createApi(props);
  }

  /**
   * @param {object} props
   * https://help.aliyun.com/document_detail/43623.html
   */
  updateApi(group, role, api) {
    const props = this.getApiProps(group, role, api);
    return this.agClient.modifyApi(props);
  }
}

module.exports = AliyunProvider;
