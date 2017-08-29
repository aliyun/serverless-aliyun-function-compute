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
const CloudAPI = require('@alicloud/cloudapi');
const RAM = require('@alicloud/ram');
const SLS = require('@alicloud/log');

const utils = require('../shared/utils');

const constants = {
  providerName: 'aliyun',
};

const keySym = Symbol('key');
const fcClientSym = Symbol('fc-client');
const agClientSym = Symbol('ag-client');
const ossClientSym = Symbol('oss-client');
const ramClientSym = Symbol('ram-client');
const slsClientSym = Symbol('sls-client');
const PROJECT_DELAY = 1500;

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
      region: this.getOssRegion()
    });
    return this[ossClientSym];
  }

  resetOssClient(bucketName) {
    const key = this.key;
    this[ossClientSym] = OSS({
      accessKeyId: key.aliyun_access_key_id,
      accessKeySecret: key.aliyun_access_key_secret,
      bucket: bucketName,
      region: this.getOssRegion()
    });
    return this[ossClientSym];
  }

  get slsClient() {
    if (this[slsClientSym]) {
      return this[slsClientSym];
    }

    const key = this.key;
    this[slsClientSym] = new SLS({
      accessKeyId: key.aliyun_access_key_id,
      accessKeySecret: key.aliyun_access_key_secret,
      region: this.options.region
    });
    return this[slsClientSym];
  }

  getStorageBucketId() {
    return "sls-storage-bucket";
  }

  getOssRegion(region) {
    return `oss-${this.options.region}`;
  }

  getStorageObjectId() {
    return "sls-storage-object";
  }

  getServiceId() {
    return "sls-function-service";
  }

  getServiceName() {
    return `${this.serverless.service.service}-${this.options.stage}`;
  }

  getApiGroupLogicalId() {
    return "sls-api-group";
  }

  getInvokeRoleLogicalId() {
    return "sls-fc-invoke-role";
  }

  getExecRoleLogicalId() {
    return "sls-fc-exec-role";
  }

  getLogProjectId() {
    return "sls-log-project";
  }

  getLogStoreId() {
    return "sls-log-store";
  }

  getLogIndexId() {
    return "sls-log-index";
  }

  getApiGroupName() {
    return `${this.getServiceName()}-api`.replace(/-/g, '_');
  }

  getLogProjectName() {
    const service = this.serverless.service.service;
    return `sls-${service}-logs`.replace(/_/g, '-');
  }

  getLogStoreName() {
    const service = this.serverless.service.service;
    return `${service}-${this.options.stage}`;
  }

  getDeploymentBucketName() {
    const service = this.serverless.service.service;
    return `sls-${service}`;
  }

  // If a function is going to be reused by multiple endpoints,
  // the user should create multiple functions instead
  // So the API name is identified by just
  // eventType and funcName
  getEventName(eventType, funcName) {
    return `sls-${eventType}-${funcName}`.replace(/-/g, '_');
  }

  getFunctionLogicalId(name) {
    return `sls-${name}`;
  }

  getApiGroupDesc() {
    const service = this.getServiceName()
    return `API group for Function Compute service ${service}, generated by ` +
           'the Serverless framework.';
  }

  getApiDesc(eventType, funcName) {
    const service = this.getServiceName()
    return `API for Function Compute function ${funcName} of service ` +
           `${service}, triggered by ${eventType} event, generated by the ` +
           'Serverless framework.';
  }

  isApiType(type) {
    return type === "ALIYUN::API::HTTP";
  }

  isTriggerType(type) {
    return type === "ALIYUN::FC::Trigger";
  }

  isLogStoreType(type) {
    return type === "ALIYUN::SLS::Store";
  }

  isFunctionType(type) {
    return type === "ALIYUN::FC::Function";
  }

  getArtifactDirectoryPrefix() {
    const service = this.serverless.service.service;
    const stage = this.options.stage;
    return `serverless/${service}/${stage}`;
  }

  getArtifactDirectoryName() {
    const prefix = this.getArtifactDirectoryPrefix();
    const date = new Date();
    const dateString = `${date.getTime().toString()}-${date.toISOString()}`;

    return `${prefix}/${dateString}`;
  }

  initializeTemplate() {
    const deploymentTemplate = this.serverless.utils.readFileSync(
      path.join(
        __dirname,
        'templates',
        'core-configuration-template.json'));
    
    this.serverless.service.provider.compiledConfigurationTemplate = deploymentTemplate;
    return deploymentTemplate;
  }

  getStorageBucketResource() {
    return {
      "Type": "ALIYUN::OSS:Bucket",
      "Properties": {
        "BucketName": this.getDeploymentBucketName(),
        "Region": this.options.region
      }
    };
  }

  getLogProjectResource() {
    const projectName = this.getLogProjectName();
    const service = this.serverless.service.service;
    return {
      "Type": "ALIYUN::SLS::Project",
      "Properties": {
        "projectName": projectName,
        "description": "Log project for serverless service " + service + ", generated by the Serverless framework"
      }
    };
  }

  getLogStoreResource() {
    const projectName = this.getLogProjectName();
    const storeName = this.getLogStoreName();
    const service = this.getServiceName();
    return {
      "Type": "ALIYUN::SLS::Store",
      "Properties": {
        "projectName": projectName,
        "storeName": storeName,
        "description": "Log store for Function Compute service " + service + ", generated by the Serverless framework",
        "ttl": 30,  // days
        "shardCount": 2
      }
    };
  }

  getLogIndexResource() {
    const projectName = this.getLogProjectName();
    const storeName = this.getLogStoreName();
    return {
      "Type": "ALIYUN::SLS::Index",
      "Properties": {
        "projectName": projectName,
        "storeName": storeName,
        "ttl": 30,
        "keys": {
          "functionName": {
            "caseSensitive": false,
            "token": [ "\n", "\t", ";", ",", "=", ":" ],
            "type": "text"
          }
        },
      }
    };
  }

  getFunctionResource(funcObject) {
    // Function-wise setting > service-wise setting > default
    const service = this.serverless.service;
    const memorySize = funcObject.memorySize
      || service.provider.memorySize
      || 128;
    const timeout = funcObject.timeout
      || service.provider.timeout
      || 30;

    // TODO(joyeecheung): description
    return {
      "Type": "ALIYUN::FC::Function",
      "Properties": {
        "name": funcObject.name,
        "service": this.getServiceName(),
        "handler": funcObject.handler,
        "memorySize": memorySize,
        "timeout": timeout,
        "runtime": "nodejs6",
        "code": {
          "ossBucketName": this.getDeploymentBucketName(),
          "ossObjectName": service.package.artifactFilePath
        }
      }
    }
  }

  getRequestConfig(eventType, event) {
    const path = event.RequestPath || event.path;
    const requestPath = path.startsWith('/') ? path : `/${path}`;
    return {
      "RequestProtocol": eventType.toUpperCase(),
      "RequestHttpMethod": (event.RequestHttpMethod || event.method || "GET").toUpperCase(),
      "RequestPath": requestPath,
      "BodyFormat": (event.BodyFormat || event.bodyFormat || '').toUpperCase(),
      "PostBodyDescription": ""
    };
  }

  getServiceConfig(event, funcObject) {
    return {
      "ServiceProtocol": "FunctionCompute",
      "Mock": "FALSE",
      "ServiceTimeout": 3000,  // TODO(joyeecheung): use config?
      "FunctionComputeConfig": {
        "FcRegionId": this.options.region,
        "ServiceName": this.getServiceName(),
        "FunctionName": funcObject.name,
        "RoleArn": undefined
      },
      "ContentTypeValue": event.ContentTypeValue || "application/json; charset=UTF-8"
    };
  }

  getType(type) {
    const dict = {
      string: 'String',
      number: 'Number'
    };
    return dict[type.toLowerCase()];
  }

  getLocation(loc) {
    const dict = {
      head: 'Head',
      query: 'Query',
      path: 'Path',
      body: 'Body',
    };
    return dict[loc.toLowerCase()];
  }

  getRequestParameters(event) {
    let result = [];
    if (event.parameters) {
      result = event.parameters.map((p) => ({
        ApiParameterName: p.name,
        ParameterType: this.getType(p.type),
        Location: this.getLocation(p.location),
        Required: p.optional ? 'OPTIONAL' : 'REQUIRED',
        isHide: false,  // do not support hidden params
        DefaultValue: p.default,
        DemoValue: p.demo,
        Description: p.description || ''
      }));
    }
    if (event.RequestParameters) {
      result = result.concat(event.RequestParameters);
    }
    return result;
  }

  getServiceParameters(event) {
    let result = [];
    if (event.parameters) {
      result = event.parameters.map((p) => ({
        ServiceParameterName: p.name,
        Type: this.getType(p.type),
        Location: this.getLocation(p.location),
        ParameterCatalog: 'REQUEST'
      }));
    }
    if (event.ServiceParameters) {
      result = result.concat(event.ServiceParameters);
    }
    return result;
  }

  getServiceParametersMap(event) {
    let result = [];
    if (event.parameters) {
      result = event.parameters.map((p) => ({
        ServiceParameterName: p.name,
        RequestParameterName: p.name
      }));
    }
    if (event.ServiceParametersMap) {
      result = result.concat(event.ServiceParametersMap);
    }
    return result;
  }

  getHttpApiResource(event, funcObject) {
    const eventType = 'http';
    return {
      "Type": "ALIYUN::API::HTTP",
      "Properties": {
        "GroupName": this.getApiGroupName(),
        "GroupId": undefined,
        "ApiName": this.getEventName(eventType, funcObject.name),
        "Visibility": event.Visibility || "PUBLIC",
        "Description": this.getApiDesc(eventType, funcObject.name),
        "AuthType": event.AuthType || "ANONYMOUS",
        "RequestConfig": this.getRequestConfig(eventType, event),
        "ServiceConfig": this.getServiceConfig(event, funcObject),
        "RequestParameters": this.getRequestParameters(event),
        "ServiceParameters": this.getServiceParameters(event),
        "ServiceParametersMap": this.getServiceParametersMap(event),
        "ResultType": event.ResultType || "JSON",
        "ResultSample": event.ResultSample || "{}"
      }
    };
  }

  getApiGroupResource() {
    return {
      "Type": "ALIYUN::API::APIGroup",
      "Properties": {
        "GroupName": this.getApiGroupName(),
        "Description": this.getApiGroupDesc(),
        "Region": this.options.region,
        "GroupId": undefined,
        "SubDomain": undefined
      }
    };
  }

  getOSSTriggerResource(event, funcObject) {
    const eventType = 'oss';
    return {
      "Type": "ALIYUN::FC::Trigger",
      "Properties": {
        "invocationRole": event.invocationRole,  // Arn of invoke-role
        "sourceArn": event.sourceArn,
        "triggerConfig": event.triggerConfig,
        "triggerName": this.getEventName(eventType, funcObject.name),
        "triggerType": eventType,
        "functionName": funcObject.name,
        "serviceName": this.getServiceName()
      }
    };
  }

  getServiceResource() {
    // TODO(joyeecheung): description
    return {
      "Type": "ALIYUN::FC::Service",
      "Properties": {
        "name": this.getServiceName(),
        "region": this.options.region,
        "logConfig": {
          "logstore": this.getLogStoreName(),
          "project": this.getLogProjectName()
        },
        // Arn of the created exec role
        "role": undefined
      }
    };
  }

  getObjectResource(objectName, localPath) {
    return {
      "Type": "ALIYUN::OSS:Object",
      "Properties": {
        "BucketName": this.getDeploymentBucketName(),
        "ObjectName": objectName,
        "LocalPath": localPath
      }
    }
  }

  getInvokeRoleName() {
    const service = this.getServiceName();
    const roleName = `sls-${service}-invoke-role`.replace(/_/g, '-');
    return roleName;
  }

  getExecRoleName() {
    const service = this.getServiceName();
    const roleName = `sls-${service}-exec-role`.replace(/_/g, '-');
    return roleName;
  }

  getInvokeRoleResource() {
    const service = this.getServiceName();
    const roleName = this.getInvokeRoleName();
    return {
      "Type": "ALIYUN::RAM::Role",
      "Properties": {
        "RoleName": roleName,
        "Description": "Allow Function Compute service " + service +
          " to be triggered, generated by the Serverless framework",
        "AssumeRolePolicyDocument": {
          "Version": "1",
          "Statement": [{
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {
              "Service": [
                // to be added
              ]
            }
          }]
        },
        // This role has the predefined fc invocation policy attached
        "Policies": [{
          "PolicyType": "System",
          "PolicyName": "AliyunFCInvocationAccess",  // predefined
          "RoleName": roleName
        }]
      }
    };
  }

  getAGService() {
    return "apigateway.aliyuncs.com";
  }

  getOSSService() {
    return "oss.aliyuncs.com";
  }

  makeRoleAccessibleFromService(resource, newService) {
    const statement = resource.Properties.AssumeRolePolicyDocument.Statement.find(
      (stmt) => stmt.Action === 'sts:AssumeRole');
    const services = statement.Principal.Service;
    const foundServices = services.find((service) => service === newService);
    if (!foundServices) {
      services.push(newService);
    }
  }

  makeRoleAccessibleFromAG(resource) {
    this.makeRoleAccessibleFromService(resource, this.getAGService());
  }

  makeRoleAccessibleFromOSS(resource) {
    this.makeRoleAccessibleFromService(resource, this.getOSSService());
  }

  getExecRolePolicyName() {
    const service = this.getServiceName();
    return `fc-${service}-access`;
  }

  getExecRoleResource() {
    const service = this.getServiceName();
    const roleName = this.getExecRoleName();
    return {
      "Type": "ALIYUN::RAM::Role",
      "Properties": {
        "RoleName": roleName,
        "Description": `Allow Function Compute service ${service} to access other services, generated by the Serverless framework`,
        // This role can be accessed by FC
        "AssumeRolePolicyDocument": {
          "Version": "1",
          "Statement": [{
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {
              "Service": [
                "fc.aliyuncs.com"
              ]
            }
          }]
        },
        "Policies": [{
          "PolicyName": this.getExecRolePolicyName(),
          "Description": `Allow Function Compute service ${service} to access other services, generated by the Serverless framework`,
          "PolicyDocument": {
            "Version": "1",
            "Statement": []
          }
        }]
      }
    };
  }

  letExecRoleAccessLog(resource) {
    this.addRamRoleStatementsToExecRole(resource, this.getLogWritePolicyStatment());
  }

  // https://help.aliyun.com/document_detail/29049.html
  getLogWritePolicyStatment() {
    const project = this.getLogProjectName();
    const store = this.getLogStoreName();
    const account = this.key.aliyun_account_id;
    return {
      "Action": [
        "log:PostLogStoreLogs"
      ],
      "Resource": [
        `acs:log:*:${account}:project/${project}/logstore/${store}`
      ],
      "Effect": "Allow"
    };
  }

  addRamRoleStatementsToExecRole(resource, statement) {
    const service = this.getServiceName();
    const execRolePolicy = this.getExecRolePolicyName();
    const policy = resource.Properties.Policies.find(
      (policy) => policy.PolicyName === execRolePolicy);
    const statements = policy.PolicyDocument.Statement;
    const foundStatement = statements.find((item) => _.isEqual(item, statement));
    if (!foundStatement) {
      statements.push(statement);
    }
  }

  getLogProject(projectName) {
    return this.slsClient.getProject(projectName).catch((err) => {
      if (err.code === 'ProjectNotExist') {
        return undefined;
      }
      throw err;
    });
  }

  sleep(timeout) {
    return new Promise((resolve, reject) => {
      setTimeout(() => resolve(), timeout);
    });
  }

  createLogProject(projectName, project) {
    return this.slsClient.createProject(projectName, {
      description: project.description
    })
    .then(this.sleep(PROJECT_DELAY))
    .then(() => this.getLogProject(projectName));
  }

  /**
   * @param {string} projectName
   * @return {logstores: [], total: number, count: number}
   */
  getLogStoresForProject(projectName) {
    return this.slsClient.listLogstore(projectName)
      .then((res) => res.logstores);
  }

  getLogStore(projectName, storeName) {
    return this.slsClient.getLogStore(projectName, storeName)
      .catch((err) => {
        if (err.code === 'LogStoreNotExist') {
          return undefined;
        }
        throw err;
      });
  }

  createLogStore(projectName, storeName, store) {
    return this.slsClient.createLogStore(projectName, storeName, store)
      .then(this.getLogStore(projectName, storeName));
  }
  
  getLogIndex(projectName, storeName) {
    return this.slsClient.getIndexConfig(projectName, storeName)
      .catch((err) => {
        if (err.code === 'IndexConfigNotExist') {
          return undefined;
        }
        throw err;
      });
  }

  createLogIndex(projectName, storeName, index) {
    return this.slsClient.createIndex(projectName, storeName, {
      ttl: index.ttl,
      keys: index.keys,
      line: index.line
    }).then(() => this.getLogIndex(projectName, storeName));
  }

  getLogsIfAvailable(projectName, storeName, days, query) {
    const from = new Date();
    const to = new Date(from);
    from.setDate(from.getDate() - days);

    const fullQuery = Object.keys(query)
      .map((key) => `${key}:${query[key]}`).join(' or ');
    return this.slsClient.getLogs(projectName, storeName, from, to, {
      query: fullQuery
    }).catch((err) => {
      if (err.code === 'IndexConfigNotExist' ||
        err.code === 'LogStoreNotExist' ||
        err.code === 'ProjectNotExist') {
          return [];
        }
        throw err;
      }
    );
  }

  /**
   * @param {string} bucketName
   * @returns {{name: string, region: string, creationDate: string}}
   */
  getBucket(bucketName) {
    // TODO(joyeecheung): handle buckets with the same name
    // in a different region
    const ossClient = this.ossClient;
    return co(function *getBucket() {
      const res = yield ossClient.listBuckets({ prefix: bucketName });
      if (!res.buckets) return undefined;
      const bucket = res.buckets.find((b) => b.name === bucketName);
      return bucket;
    });
  }

  /**
   * @param {string} bucketName 
   */
  createBucket(bucketName) {
    const ossClient = this.ossClient;
    const region = this.getOssRegion();
    return co(function *createBucket() {
      return yield ossClient.putBucket(bucketName, region)
    });
  }

  /**
   * @param {string} bucketName 
   */
  deleteBucket(bucketName) {
    const ossClient = this.ossClient;
    const region = this.getOssRegion();
    return co(function *deleteBucket() {
      return yield ossClient.deleteBucket(bucketName, region)
    });
  }

  uploadObject(objectName, filePath) {
    const ossClient = this.ossClient;
    return co(function *uploadObject() {
      return yield ossClient.put(objectName, filePath)
    });
  }

  deleteObjects(objectNames) {
    const ossClient = this.ossClient;
    return co(function *deleteObjects() {
      // TODO(joyeecheung): handle partial failures
      return yield ossClient.deleteMulti(objectNames)
    });
  }

  /**
   * 
   * @param {object} props 
   */
  getObjects(props) {
    // TODO(joyeecheung): handle >= 1000 objects
    const ossClient = this.ossClient;
    const query = Object.assign({ 'max-keys': 999 }, props);
    return co(function *listObjects() {
      const res = yield ossClient.list(query);
      return res.objects || [];
    });
  }

  // http://doxmate.cool/aliyun/fc-nodejs-sdk/api.html

  /**
   * @param {string} serviceName
   * @return {ServiceResponse}
   */
  getService(serviceName) {
    return this.fcClient.getService(serviceName)
      .catch((err) => {
        if (err.code === 'ServiceNotFound') return undefined;
        throw err;
      });
  }

  /**
   * @param {string} serviceName
   * @param {{role: string, logConfig: {logstore: string, project: string}}} spec
   * @return {ServiceResponse}
   * https://help.aliyun.com/document_detail/52877.html#service
   * https://help.aliyun.com/document_detail/52877.html#serviceresponse
   */
  createService(serviceName, spec) {
    return this.fcClient.createService(serviceName, spec);
  }

  deleteService(serviceName, options) {
    return this.fcClient.deleteService(serviceName, options);
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
   * @param {string} funcName
   * @param {Function} options
   * @return {FunctionResponse}
   * https://help.aliyun.com/document_detail/52877.html#function
   * https://help.aliyun.com/document_detail/52877.html#functionresponse
   */
  createFunction(serviceName, functionName, options) {
    const config = Object.assign({ functionName }, options);
    return this.fcClient.createFunction(serviceName, config);
  }

  /**
   * @param {string} serviceName
   * @param {string} functionName
   * @param {Function} options
   * @return {FunctionResponse}
   */
  updateFunction(serviceName, functionName, options) {
    const config = Object.assign({ functionName }, options);
    return this.fcClient.updateFunction(serviceName, functionName, config);
  }

  /**
   * @param {string} serviceName
   * @return {{functionName: string, functionId: string}}
   * TODO(joyeecheung): paging
   */
  getFunctions(serviceName) {
    return this.fcClient.listFunctions(serviceName).then((res) => {
      const functions = res.functions;
      if (!functions) return [];
      return functions;
    });
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
    return this.fcClient.invokeFunction(serviceName, functionName, event);
  }

  /**
   * @param {string} serviceName
   * @param {string} functionName
   * @param {Trigger} trigger
   * @return {TriggerResponse}https://help.aliyun.com/document_detail/52877.html#trigger
   * https://help.aliyun.com/document_detail/52877.html#triggerresponse
   */
  createTrigger(serviceName, functionName, trigger, role) {
    const triggerProps = Object.assign({}, trigger, {
      invocationRole: role.Arn
    });
    return this.fcClient.createTrigger(serviceName, functionName, triggerProps);
  }

  /**
   * @param {string} serviceName
   * @param {string} functionName
   * @param {string} triggerName
   * @return {TriggerResponse}
   */
  getTrigger(serviceName, functionName, triggerName) {
    return this.fcClient.getTrigger(serviceName, functionName, triggerName)
      .catch((err) => {
        if (['ServiceNotFound', 'FunctionNotFound', 'TriggerNotFound'].indexOf(err.code)) {
          return undefined;
        }
        throw err;
      });
  }

  listTriggers(serviceName, functionName) {
    return this.fcClient.listTriggers(serviceName, functionName);
  }

  /**
   * @param {string} serviceName
   * @param {string} functionName
   * @param {string} triggerName
   * @param {Trigger} trigger
   * @return {TriggerResponse}
   */
  updateTrigger(serviceName, functionName, triggerName, trigger, role) {
    const triggerProps = Object.assign({}, trigger, {
      invocationRole: role.Arn
    });

    return this.fcClient.createTrigger(
      serviceName, functionName, triggerName, triggerProps);
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

  /**
   * @param {string} groupName
   * @return {{GroupId: string, GroupName: string, SubDomain: string}}
   * https://help.aliyun.com/document_detail/43616.html
   */
  getApiGroup(groupName) {
    // TODO(joyeecheung): pagination
    return this.agClient.describeApiGroups({
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

  /**
   * @param {{GroupId: string}} group
   * https://help.aliyun.com/document_detail/43617.html
   */
  deleteApiGroup(group) {
    return this.agClient.deleteApiGroup(group);
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
   * @param {string} roleName
   * @return {{RoleId: string, RoleName: string, Arn: string}}
   * https://help.aliyun.com/document_detail/28711.html
   */
  getRole(roleName) {
    return this.ramClient.getRole({
      RoleName: roleName
    }).then(
      (res) => res.Role,
      (err) => {
        if (err.name === 'EntityNotExist.RoleError') return undefined;
        throw err;
      }
    );
  }

  deleteRole(roleName) {
    return this.ramClient.deleteRole({
      RoleName: roleName
    });
  }

  /**
   * @param {object} role
   * @return {{RoleId: string, RoleName: string, Arn: string}}
   * https://help.aliyun.com/document_detail/28710.html 
   */
  createRole(role) {
    return this.ramClient.createRole({
      RoleName: role.RoleName,
      Description: role.Description,
      AssumeRolePolicyDocument: JSON.stringify(role.AssumeRolePolicyDocument)
    }).then((res) => res.Role);
  }

  /**
   * @param {string} roleName
   * @return {{PolicyName: string}[]}
   */
  getPoliciesForRole(roleName) {
    return this.ramClient.listPoliciesForRole({
      RoleName: roleName
    }).then((res) => res.Policies.Policy);
  }

  /**
   * 
   * @param {string} policyName 
   * @param {'Custom' | 'System' } policyType 
   */
  getPolicy(policyName, policyType) {
    return this.ramClient.getPolicy({
      PolicyName: policyName,
      PolicyType: policyType
    }).then(
      (res) => res.Policy,
      (err) => {
        if (err.name === 'EntityNotExist.PolicyError') return undefined;
        throw err;
      }
    );
  }

  /**
   * 
   * @param {{PolicyName: string, PolicyDocument: object, Description: string}} policy 
   */
  createPolicy(policy) {
    return this.ramClient.createPolicy({
      PolicyName: policy.PolicyName,
      Description: policy.Description,
      PolicyDocument: JSON.stringify(policy.PolicyDocument)
    });
  }

  /**
   * @param {{RoleName: string}} role
   * @param {{PolicyName: string, PolicyType: string}} policy
   * @return {{PolicyName: string}[]}
   */
  attachPolicyToRole(role, policy) {
    return this.ramClient.attachPolicyToRole({
      RoleName: role.RoleName,
      PolicyName: policy.PolicyName,
      PolicyType: policy.PolicyType
    });
  }

  /**
   * @param {{RoleName: string}} role
   * @param {{PolicyName: string, PolicyType: string}} policy
   */
  detachPolicyFromRole(role, policy) {
    return this.ramClient.detachPolicyFromRole({
      RoleName: role.RoleName,
      PolicyName: policy.PolicyName,
      PolicyType: policy.PolicyType
    });
  }

  /**
   * @param {{GroupId: string}} props 
   * @returns {{GroupId: string, ApiName: string, ApiId: string}[]} 
   * https://help.aliyun.com/document_detail/43626.html
   */
  getApis(props) {
    const query = Object.assign({}, props, { PageSize: 50 });
    return this.agClient.describeApis(query)
      .then((res) => {
        if (!res.ApiSummarys) return [];
        const apis = res.ApiSummarys.ApiSummary;
        if (res.TotalCount > apis.length) {
          // TODO(joyeecheung): pagination
        }
        return apis;
      });
  }

  /**
   * https://help.aliyun.com/document_detail/43625.html
   */
  getApi(group, api) {
    const query = {
      GroupId: group.GroupId,
      ApiId: api.ApiId
    };
    return this.agClient.describeApi(query);
  }

  getApiProps(group, role, api) {
    const toStringify = ['RequestConfig', 'ServiceConfig',
      'RequestParameters', 'ServiceParameters', 'ServiceParametersMap'];
    const props = _.cloneDeep(api);
    props.ServiceConfig.FunctionComputeConfig.RoleArn = role.Arn;
    props.GroupId = group.GroupId;
    toStringify.forEach((key) => {
      props[key] = JSON.stringify(props[key]);
    });
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
   * 
   * @param {{GroupId: string}} group 
   * @param {{ApiId: string}} api 
   * https://help.aliyun.com/document_detail/43639.html
   */
  deleteApi(group, api) {
    const props = {
      GroupId: group.GroupId,
      ApiId: api.ApiId
    };
    return this.agClient.deleteApi(props);
  }

  /**
   * @param {object} props
   * https://help.aliyun.com/document_detail/43623.html
   */
  updateApi(group, role, api) {
    const props = this.getApiProps(group, role, api);
    return this.agClient.modifyApi(props);
  }

  deployApi(group, api) {
    const props = {
      GroupId: group.GroupId,
      ApiId: api.ApiId,
      StageName: "RELEASE",  // TODO(joyeecheung): should be based on this.options.stage?
      Description: "Release by the Serverless framework"
    };
    return this.agClient.deployApi(props);
  }

  /**
   * @param {{GroupId: string}} props 
   * @returns {{GroupId: string, ApiName: string, ApiId: string}[]}
   */
  getDeployedApis(props) {
    const query = {
      GroupId: props.GroupId,
      StageName: "RELEASE",  // TODO(joyeecheung): should be based on this.options.stage?
      PageSize: 50  // TODO(joyeecheung): pagination
    };
    return this.agClient.describeDeployedApis(query)
      .then((res) => {
        if (!res.DeployedApis) return [];
        const apis = res.DeployedApis.DeployedApiItem;
        if (res.TotalCount > apis.length) {
          // TODO(joyeecheung): pagination
        }
        return apis.filter((item) => item.RegionId === this.options.region);
      });
  }

  abolishApi(group, api) {
    const props = {
      GroupId: group.GroupId,
      ApiId: api.ApiId,
      StageName: "RELEASE",  // TODO(joyeecheung): should be based on this.options.stage?
    };
    return this.agClient.abolishApi(props);
  }
}

module.exports = AliyunProvider;
