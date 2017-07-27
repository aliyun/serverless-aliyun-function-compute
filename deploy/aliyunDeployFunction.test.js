'use strict';

const sinon = require('sinon');
const BbPromise = require('bluebird');
const path = require('path');
const fs = require('fs');
const { apiGroup, apis, group, fullGroup, role, fullRole, fullApis, functions } = require('../test/data');

const AliyunProvider = require('../provider/aliyunProvider');
const AliyunDeployFunction = require('./aliyunDeployFunction');
const Serverless = require('../test/serverless');
const functionDefs = {
  postTest: {
    handler: 'index.postHandler',
    events: [
      { http: {
        path: '/baz',
        method: 'post'
      } },
    ],
  },
  getTest: {
    handler: 'index.getHandler',
    events: [
      { http: {
        path: '/quo',
        method: 'get'
      } },
    ],
  }
};

describe('AliyunDeployFunction', () => {
  let serverless;
  let aliyunDeployFunction;
  const servicePath = path.join(__dirname, '..', 'test');
  const directory = 'serverless/my-service/dev/1501150613924-2017-07-27T10:16:53.924Z'

  beforeEach(() => {
    serverless = new Serverless();
    serverless.service.functions = functionDefs;
    serverless.service.service = 'my-service';
    serverless.service.package = {
      artifact: '/tmp/artifact.zip'
    };
    serverless.service.provider = {
      name: 'aliyun',
      credentials: path.join(__dirname, '..', 'test', 'credentials'),
    };
    serverless.config = {
      servicePath: path.join(__dirname, '..', 'test')
    };
  });

  describe('#constructor()', () => {
    const options = {
      stage: 'dev',
      region: 'cn-shanghai',
      function: 'postTest'
    };

    beforeEach(() => {
      serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
      serverless.pluginManager.setCliOptions(options);
      aliyunDeployFunction = new AliyunDeployFunction(serverless, options);
    });

    it('should set the serverless instance', () => {
      expect(aliyunDeployFunction.serverless).toEqual(serverless);
    });

    it('should set options if provided', () => {
      expect(aliyunDeployFunction.options).toEqual(options);
    });

    it('should make the provider accessible', () => {
      expect(aliyunDeployFunction.provider).toBeInstanceOf(AliyunProvider);
    });

    describe('hooks', () => {
      let validateStub;
      let setDefaultsStub;
      let packageFunctionStub;
      let compileTemplatesStub;
      let setupServiceStub;
      let uploadArtifactsStub;
      let setupFunctionsStub;
      let setupEventsStub;

      beforeEach(() => {
        validateStub = sinon.stub(aliyunDeployFunction, 'validate')
          .returns(BbPromise.resolve());
        setDefaultsStub = sinon.stub(aliyunDeployFunction, 'setDefaults')
          .returns(BbPromise.resolve());
        packageFunctionStub = sinon.stub(aliyunDeployFunction, 'packageFunction')
          .returns(BbPromise.resolve());
        compileTemplatesStub = sinon.stub(aliyunDeployFunction, 'compileTemplates')
          .returns(BbPromise.resolve());
        setupServiceStub = sinon.stub(aliyunDeployFunction, 'setupService')
          .returns(BbPromise.resolve());
        uploadArtifactsStub = sinon.stub(aliyunDeployFunction, 'uploadArtifacts')
          .returns(BbPromise.resolve());
        setupFunctionsStub = sinon.stub(aliyunDeployFunction, 'setupFunctions')
          .returns(BbPromise.resolve());
        setupEventsStub = sinon.stub(aliyunDeployFunction, 'setupEvents')
          .returns(BbPromise.resolve());
      });

      afterEach(() => {
        aliyunDeployFunction.validate.restore();
        aliyunDeployFunction.setDefaults.restore();
        aliyunDeployFunction.packageFunction.restore();
        aliyunDeployFunction.compileTemplates.restore();
        aliyunDeployFunction.setupService.restore();
        aliyunDeployFunction.uploadArtifacts.restore();
        aliyunDeployFunction.setupFunctions.restore();
        aliyunDeployFunction.setupEvents.restore();
      });

      it('should run "deploy:function:initialize" promise chain', () => aliyunDeployFunction
        .hooks['deploy:function:initialize']().then(() => {
          expect(validateStub.calledOnce).toEqual(true);
          expect(setDefaultsStub.calledAfter(validateStub)).toEqual(true);
        }));

      it('should run "deploy:function:packageFunction" promise chain', () => aliyunDeployFunction
        .hooks['deploy:function:packageFunction']().then(() => {
          expect(packageFunctionStub.calledOnce).toEqual(true);
          expect(compileTemplatesStub.calledAfter(packageFunctionStub)).toEqual(true);
        }));

      it('should run "deploy:function:deploy" promise chain', () => aliyunDeployFunction
        .hooks['deploy:function:deploy']().then(() => {
          expect(setupServiceStub.calledOnce).toEqual(true);
          expect(uploadArtifactsStub.calledAfter(setupServiceStub)).toEqual(true);
          expect(setupFunctionsStub.calledAfter(uploadArtifactsStub)).toEqual(true);
          expect(setupEventsStub.calledAfter(setupFunctionsStub)).toEqual(true);
        }));
    });
  });

  describe('#deployFunction()', () => {
    let getServiceStub;
    let consoleLogStub;
    let createServiceStub;
    let getBucketStub;
    let createBucketStub;
    let uploadObjectStub;
    let getFunctionStub;
    let updateFunctionStub;
    let createFunctionStub;
    let getApiGroupStub;
    let createApiGroupStub;
    let getApiRoleStub;
    let createApiRoleStub;
    let getPoliciesStub;
    let createPolicyStub;
    let getApisStub;
    let updateApiStub;
    let createApiStub;
    let deployApiStub;
    const options = {
      stage: 'dev',
      region: 'cn-shanghai',
      function: 'postTest'
    };

    beforeEach(() => {
      serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
      serverless.pluginManager.setCliOptions(options);
      aliyunDeployFunction = new AliyunDeployFunction(serverless, options);
      getServiceStub = sinon.stub(aliyunDeployFunction.provider, 'getService');
      consoleLogStub = sinon.stub(aliyunDeployFunction.serverless.cli, 'log').returns();
      createServiceStub = sinon.stub(aliyunDeployFunction.provider, 'createService');
      getBucketStub = sinon.stub(aliyunDeployFunction.provider, 'getBucket');
      createBucketStub = sinon.stub(aliyunDeployFunction.provider, 'createBucket');
      uploadObjectStub = sinon.stub(aliyunDeployFunction.provider, 'uploadObject');
      getFunctionStub = sinon.stub(aliyunDeployFunction.provider, 'getFunction');
      updateFunctionStub = sinon.stub(aliyunDeployFunction.provider, 'updateFunction');
      createFunctionStub = sinon.stub(aliyunDeployFunction.provider, 'createFunction');getApiGroupStub = sinon.stub(aliyunDeployFunction.provider, 'getApiGroup');
      createApiGroupStub = sinon.stub(aliyunDeployFunction.provider, 'createApiGroup');
      getApiRoleStub = sinon.stub(aliyunDeployFunction.provider, 'getApiRole');
      createApiRoleStub = sinon.stub(aliyunDeployFunction.provider, 'createApiRole');
      getPoliciesStub = sinon.stub(aliyunDeployFunction.provider, 'getPolicies');
      createPolicyStub = sinon.stub(aliyunDeployFunction.provider, 'createPolicy');
      getApisStub = sinon.stub(aliyunDeployFunction.provider, 'getApis');
      updateApiStub = sinon.stub(aliyunDeployFunction.provider, 'updateApi');
      createApiStub = sinon.stub(aliyunDeployFunction.provider, 'createApi');
      deployApiStub = sinon.stub(aliyunDeployFunction.provider, 'deployApi');

      sinon.stub(aliyunDeployFunction.provider, 'getArtifactDirectoryName').returns(directory);
    });

    afterEach(() => {
      aliyunDeployFunction.provider.getService.restore();
      aliyunDeployFunction.serverless.cli.log.restore();
      aliyunDeployFunction.provider.createService.restore();
      aliyunDeployFunction.provider.getBucket.restore();
      aliyunDeployFunction.provider.createBucket.restore();
      aliyunDeployFunction.provider.uploadObject.restore();
      aliyunDeployFunction.provider.getFunction.restore();
      aliyunDeployFunction.provider.updateFunction.restore();
      aliyunDeployFunction.provider.createFunction.restore();
      aliyunDeployFunction.provider.getApiGroup.restore();
      aliyunDeployFunction.provider.createApiGroup.restore();
      aliyunDeployFunction.provider.getApiRole.restore();
      aliyunDeployFunction.provider.createApiRole.restore();
      aliyunDeployFunction.provider.getPolicies.restore();
      aliyunDeployFunction.provider.createPolicy.restore();
      aliyunDeployFunction.provider.getApis.restore();
      aliyunDeployFunction.provider.updateApi.restore();
      aliyunDeployFunction.provider.createApi.restore();
      aliyunDeployFunction.provider.deployApi.restore();
      aliyunDeployFunction.provider.getArtifactDirectoryName.restore();
    });

    it('should set up service from scratch', () => {
      const serviceId = new Date().getTime().toString(16);
      getServiceStub.returns(BbPromise.resolve(undefined));
      createServiceStub.returns(BbPromise.resolve({ serviceId }));
      getBucketStub.returns(BbPromise.resolve(undefined));
      createBucketStub.returns(BbPromise.resolve());
      uploadObjectStub.returns(BbPromise.resolve());
      getFunctionStub.returns(BbPromise.resolve(undefined));
      updateFunctionStub.returns(BbPromise.resolve());
      createFunctionStub.returns(BbPromise.resolve());
      getApiGroupStub.returns(BbPromise.resolve(undefined));
      createApiGroupStub.returns(BbPromise.resolve(fullGroup));
      getApiRoleStub.returns(BbPromise.resolve(undefined));
      createApiRoleStub.returns(BbPromise.resolve(fullRole));
      getPoliciesStub.returns(BbPromise.resolve([]));
      createPolicyStub.returns(BbPromise.resolve(role.Policies[0]));
      getApisStub.returns(BbPromise.resolve([]));
      updateApiStub.returns(BbPromise.resolve());
      createApiStub.returns(BbPromise.resolve(fullApis[1]));
      deployApiStub.returns(BbPromise.resolve());

      const logs = [
        'Packaging function: postTest...',
        'Compiling function "postTest"...',
        'Creating service my-service-dev...',
        'Created service my-service-dev',
        'Creating bucket sls-my-service...',
        'Created bucket sls-my-service',
        'Uploading serverless/my-service/dev/1501150613924-2017-07-27T10:16:53.924Z/postTest.zip to OSS bucket sls-my-service...',
        'Uploaded serverless/my-service/dev/1501150613924-2017-07-27T10:16:53.924Z/postTest.zip to OSS bucket sls-my-service',
        'Creating function my-service-dev-postTest...',
        'Created function my-service-dev-postTest',
        'Creating API group my_service_dev_api...',
        'Created API group my_service_dev_api',
        'Creating RAM role SLSFCInvocationFromAPIGateway...',
        'Created RAM role SLSFCInvocationFromAPIGateway',
        'Attaching RAM policy AliyunFCInvocationAccess to SLSFCInvocationFromAPIGateway...',
        'Attached RAM policy AliyunFCInvocationAccess to SLSFCInvocationFromAPIGateway',
        'Creating API sls_http_my_service_dev_postTest...',
        'Created API sls_http_my_service_dev_postTest',
        'Deploying API sls_http_my_service_dev_postTest...',
        'Deployed API sls_http_my_service_dev_postTest',
        'POST http://523e8dc7bbe04613b5b1d726c2a7889d-cn-shanghai.alicloudapi.com/baz -> my-service-dev.my-service-dev-postTest'
      ];
      return aliyunDeployFunction.hooks['deploy:function:initialize']()
        .then(() => aliyunDeployFunction.hooks['deploy:function:packageFunction']())
        .then(() => aliyunDeployFunction.hooks['deploy:function:deploy']())
        .then(() => {
          for (var i = 0; i < consoleLogStub.callCount; ++i) {
            expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
          }
        });
    });

    it('should handle existing service ', () => {
      const serviceId = new Date().getTime().toString(16);
      getServiceStub.returns(BbPromise.resolve({ serviceId }));
      createServiceStub.returns(BbPromise.resolve({ serviceId }));
      getBucketStub.returns(BbPromise.resolve({
        name: 'sls-my-service',
        region: 'cn-shanghai'
      }));
      createBucketStub.returns(BbPromise.resolve());
      uploadObjectStub.returns(BbPromise.resolve());
      getFunctionStub
        .withArgs('my-service-dev', 'my-service-dev-postTest')
        .returns(BbPromise.resolve(functions[0]));
      getFunctionStub
        .withArgs('my-service-dev', 'my-service-dev-getTest')
        .returns(BbPromise.resolve(functions[1]));
      updateFunctionStub.returns(BbPromise.resolve());
      createFunctionStub.returns(BbPromise.resolve());

      getApiGroupStub.returns(BbPromise.resolve(fullGroup));
      createApiGroupStub.returns(BbPromise.resolve());
      getApiRoleStub.returns(BbPromise.resolve(fullRole));
      createApiRoleStub.returns(BbPromise.resolve());
      getPoliciesStub.returns(BbPromise.resolve(role.Policies));
      createPolicyStub.returns(BbPromise.resolve());
      getApisStub.returns(BbPromise.resolve(fullApis));
      createApiStub.returns(BbPromise.resolve());
      updateApiStub.returns(BbPromise.resolve(fullApis[1]));
      deployApiStub.returns(BbPromise.resolve());

      const logs = [
        'Packaging function: postTest...',
        'Compiling function "postTest"...',
        'Service my-service-dev already exists.',
        'Bucket sls-my-service already exists.',
        'Uploading serverless/my-service/dev/1501150613924-2017-07-27T10:16:53.924Z/postTest.zip to OSS bucket sls-my-service...',
        'Uploaded serverless/my-service/dev/1501150613924-2017-07-27T10:16:53.924Z/postTest.zip to OSS bucket sls-my-service',
        'Updating function my-service-dev-postTest...',
        'Updated function my-service-dev-postTest',
        'API group my_service_dev_api exists.',
        'RAM role SLSFCInvocationFromAPIGateway exists.',
        'RAM policy AliyunFCInvocationAccess exists.',
        'Updating API sls_http_my_service_dev_postTest...',
        'Updated API sls_http_my_service_dev_postTest',
        'Deploying API sls_http_my_service_dev_postTest...',
        'Deployed API sls_http_my_service_dev_postTest',
        'POST http://523e8dc7bbe04613b5b1d726c2a7889d-cn-shanghai.alicloudapi.com/baz -> my-service-dev.my-service-dev-postTest'
      ];
      return aliyunDeployFunction.hooks['deploy:function:initialize']()
        .then(() => aliyunDeployFunction.hooks['deploy:function:packageFunction']())
        .then(() => aliyunDeployFunction.hooks['deploy:function:deploy']())
        .then(() => {
          for (var i = 0; i < consoleLogStub.callCount; ++i) {
            expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
          }
        });
    });
  });
});