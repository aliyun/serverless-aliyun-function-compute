/*global beforeEach, afterEach, expect*/

'use strict';

const sinon = require('sinon');
const path = require('path');
const {
  fullGroup, role, fullRole,
  fullApis, functions, fullExecRole, execRole, functionDefs,
  fullLogIndex, fullLogProject,
  fullLogStore, directory, fullService
} = require('../test/data');

const AliyunProvider = require('../provider/aliyunProvider');
const AliyunDeployFunction = require('./aliyunDeployFunction');
const Serverless = require('../test/serverless');

describe('AliyunDeployFunction', () => {
  let serverless;
  let aliyunDeployFunction;

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
          .returns(Promise.resolve());
        setDefaultsStub = sinon.stub(aliyunDeployFunction, 'setDefaults')
          .returns();
        packageFunctionStub = sinon.stub(aliyunDeployFunction, 'packageFunction')
          .returns(Promise.resolve());
        compileTemplatesStub = sinon.stub(aliyunDeployFunction, 'compileTemplates')
          .returns(Promise.resolve());
        setupServiceStub = sinon.stub(aliyunDeployFunction, 'setupService')
          .returns(Promise.resolve());
        uploadArtifactsStub = sinon.stub(aliyunDeployFunction, 'uploadArtifacts')
          .returns(Promise.resolve());
        setupFunctionsStub = sinon.stub(aliyunDeployFunction, 'setupFunctions')
          .returns(Promise.resolve());
        setupEventsStub = sinon.stub(aliyunDeployFunction, 'setupEvents')
          .returns(Promise.resolve());
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
    let getLogProjectStub;
    let createLogProjectStub;
    let getLogStoreStub;
    let createLogStoreStub;
    let getLogIndexStub;
    let createLogIndexStub;

    let getRoleStub;
    let createRoleStub;
    let getPoliciesForRoleStub;
    let getPolicyStub;
    let createPolicyStub;
    let attachPolicyToRoleStub;

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
    let getApisStub;
    let updateApiStub;
    let createApiStub;
    let deployApiStub;

    let getTriggerStub;

    const options = {
      stage: 'dev',
      region: 'cn-shanghai',
      function: 'postTest'
    };

    beforeEach(() => {
      serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
      serverless.pluginManager.setCliOptions(options);
      aliyunDeployFunction = new AliyunDeployFunction(serverless, options);
      consoleLogStub = sinon.stub(aliyunDeployFunction.serverless.cli, 'log').returns();

      getLogProjectStub = sinon.stub(aliyunDeployFunction.provider, 'getLogProject');
      createLogProjectStub = sinon.stub(aliyunDeployFunction.provider, 'createLogProject');
      getLogStoreStub = sinon.stub(aliyunDeployFunction.provider, 'getLogStore');
      createLogStoreStub = sinon.stub(aliyunDeployFunction.provider, 'createLogStore');
      getLogIndexStub = sinon.stub(aliyunDeployFunction.provider, 'getLogIndex');
      createLogIndexStub = sinon.stub(aliyunDeployFunction.provider, 'createLogIndex');

      getRoleStub = sinon.stub(aliyunDeployFunction.provider, 'getRole');
      createRoleStub = sinon.stub(aliyunDeployFunction.provider, 'createRole');
      getPolicyStub = sinon.stub(aliyunDeployFunction.provider, 'getPolicy');
      createPolicyStub = sinon.stub(aliyunDeployFunction.provider, 'createPolicy');
      getPoliciesForRoleStub = sinon.stub(aliyunDeployFunction.provider, 'getPoliciesForRole');
      attachPolicyToRoleStub = sinon.stub(aliyunDeployFunction.provider, 'attachPolicyToRole');

      getServiceStub = sinon.stub(aliyunDeployFunction.provider, 'getService');
      createServiceStub = sinon.stub(aliyunDeployFunction.provider, 'createService');
      getBucketStub = sinon.stub(aliyunDeployFunction.provider, 'getBucket');
      createBucketStub = sinon.stub(aliyunDeployFunction.provider, 'createBucket');
      uploadObjectStub = sinon.stub(aliyunDeployFunction.provider, 'uploadObject');
      getFunctionStub = sinon.stub(aliyunDeployFunction.provider, 'getFunction');
      updateFunctionStub = sinon.stub(aliyunDeployFunction.provider, 'updateFunction');
      createFunctionStub = sinon.stub(aliyunDeployFunction.provider, 'createFunction');

      getApiGroupStub = sinon.stub(aliyunDeployFunction.provider, 'getApiGroup');
      createApiGroupStub = sinon.stub(aliyunDeployFunction.provider, 'createApiGroup');
      getApisStub = sinon.stub(aliyunDeployFunction.provider, 'getApis');
      updateApiStub = sinon.stub(aliyunDeployFunction.provider, 'updateApi');
      createApiStub = sinon.stub(aliyunDeployFunction.provider, 'createApi');
      deployApiStub = sinon.stub(aliyunDeployFunction.provider, 'deployApi');

      getTriggerStub = sinon.stub(aliyunDeployFunction.provider, 'getTrigger');
      sinon.stub(aliyunDeployFunction.provider, 'updateTrigger');
      sinon.stub(aliyunDeployFunction.provider, 'createTrigger');

      sinon.stub(aliyunDeployFunction.provider, 'getArtifactDirectoryName').returns(directory);
    });

    afterEach(() => {
      aliyunDeployFunction.serverless.cli.log.restore();

      aliyunDeployFunction.provider.getLogProject.restore();
      aliyunDeployFunction.provider.createLogProject.restore();
      aliyunDeployFunction.provider.getLogStore.restore();
      aliyunDeployFunction.provider.createLogStore.restore();
      aliyunDeployFunction.provider.getLogIndex.restore();
      aliyunDeployFunction.provider.createLogIndex.restore();

      aliyunDeployFunction.provider.getRole.restore();
      aliyunDeployFunction.provider.createRole.restore();
      aliyunDeployFunction.provider.getPoliciesForRole.restore();
      aliyunDeployFunction.provider.getPolicy.restore();
      aliyunDeployFunction.provider.createPolicy.restore();

      aliyunDeployFunction.provider.getService.restore();
      aliyunDeployFunction.provider.createService.restore();
      aliyunDeployFunction.provider.getBucket.restore();
      aliyunDeployFunction.provider.createBucket.restore();
      aliyunDeployFunction.provider.uploadObject.restore();
      aliyunDeployFunction.provider.getFunction.restore();
      aliyunDeployFunction.provider.updateFunction.restore();
      aliyunDeployFunction.provider.createFunction.restore();

      aliyunDeployFunction.provider.getApiGroup.restore();
      aliyunDeployFunction.provider.createApiGroup.restore();
      aliyunDeployFunction.provider.getApis.restore();
      aliyunDeployFunction.provider.updateApi.restore();
      aliyunDeployFunction.provider.createApi.restore();
      aliyunDeployFunction.provider.deployApi.restore();

      aliyunDeployFunction.provider.getTrigger.restore();
      aliyunDeployFunction.provider.updateTrigger.restore();
      aliyunDeployFunction.provider.createTrigger.restore();

      aliyunDeployFunction.provider.getArtifactDirectoryName.restore();
    });

    it('should set up service from scratch', () => {
      getLogProjectStub.returns(Promise.resolve(undefined));
      createLogProjectStub.returns(Promise.resolve(fullLogProject));
      getLogStoreStub.returns(Promise.resolve(undefined));
      createLogStoreStub.returns(Promise.resolve(fullLogStore));
      getLogIndexStub.returns(Promise.resolve(undefined));
      createLogIndexStub.returns(Promise.resolve(fullLogIndex));

      getRoleStub.returns(Promise.resolve(undefined));
      createRoleStub.onCall(0).returns(Promise.resolve(fullExecRole));
      createRoleStub.onCall(1).returns(Promise.resolve(fullRole));
      getPolicyStub.returns(Promise.resolve(undefined));
      createPolicyStub.returns(Promise.resolve({}));
      getPoliciesForRoleStub.returns(Promise.resolve([]));
      attachPolicyToRoleStub.returns(Promise.resolve());

      getServiceStub.returns(Promise.resolve(undefined));
      createServiceStub.returns(Promise.resolve(fullService));
      getBucketStub.returns(Promise.resolve(undefined));
      createBucketStub.returns(Promise.resolve());
      uploadObjectStub.returns(Promise.resolve());
      getFunctionStub.returns(Promise.resolve(undefined));
      updateFunctionStub.returns(Promise.resolve());
      createFunctionStub.returns(Promise.resolve());

      getApiGroupStub.returns(Promise.resolve(undefined));
      createApiGroupStub.returns(Promise.resolve(fullGroup));
      getApisStub.returns(Promise.resolve([]));
      updateApiStub.returns(Promise.resolve());
      createApiStub.returns(Promise.resolve(fullApis[1]));
      deployApiStub.returns(Promise.resolve());

      getTriggerStub.returns(Promise.resolve());

      const logs = [
        'Packaging function: postTest...',
        'Compiling function "postTest"...',
        'Creating log project sls-accountid-logs...',
        'Created log project sls-accountid-logs',
        'Creating log store sls-accountid-logs/my-service-dev...',
        'Created log store sls-accountid-logs/my-service-dev',
        'Creating log index for sls-accountid-logs/my-service-dev...',
        'Created log index for sls-accountid-logs/my-service-dev',
        'Creating RAM role sls-my-service-dev-exec-role...',
        'Created RAM role sls-my-service-dev-exec-role',
        'Creating RAM policy fc-my-service-dev-access...',
        'Created RAM policy fc-my-service-dev-access',
        'Attaching RAM policy fc-my-service-dev-access to sls-my-service-dev-exec-role...',
        'Attached RAM policy fc-my-service-dev-access to sls-my-service-dev-exec-role',
        'Creating service my-service-dev...',
        'Created service my-service-dev',
        'Creating bucket sls-accountid...',
        'Created bucket sls-accountid',
        'Uploading serverless/my-service/dev/1500622721413-2017-07-21T07:38:41.413Z/postTest.zip to OSS bucket sls-accountid...',
        'Uploaded serverless/my-service/dev/1500622721413-2017-07-21T07:38:41.413Z/postTest.zip to OSS bucket sls-accountid',
        'Creating function my-service-dev-postTest...',
        'Created function my-service-dev-postTest',
        'Creating RAM role sls-my-service-dev-invoke-role...',
        'Created RAM role sls-my-service-dev-invoke-role',
        'Attaching RAM policy AliyunFCInvocationAccess to sls-my-service-dev-invoke-role...',
        'Attached RAM policy AliyunFCInvocationAccess to sls-my-service-dev-invoke-role',
        'Creating API group my_service_dev_api...',
        'Created API group my_service_dev_api',
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
      getLogProjectStub.returns(Promise.resolve(fullLogProject));
      createLogProjectStub.returns(Promise.resolve());
      getLogStoreStub.returns(Promise.resolve(fullLogStore));
      createLogStoreStub.returns(Promise.resolve());
      getLogIndexStub.returns(Promise.resolve(fullLogIndex));
      createLogIndexStub.returns(Promise.resolve());

      getRoleStub.onCall(0).returns(Promise.resolve(fullExecRole));
      getRoleStub.onCall(1).returns(Promise.resolve(fullRole));
      createRoleStub.returns(Promise.resolve());
      getPolicyStub.returns(Promise.resolve({
        PolicyType: 'Custom',
        PolicyName: execRole.Policies[0].PolicyName
      }));
      createPolicyStub.returns(Promise.resolve({}));
      getPoliciesForRoleStub.onCall(0).returns(Promise.resolve(execRole.Policies));
      getPoliciesForRoleStub.onCall(1).returns(Promise.resolve(role.Policies));
      attachPolicyToRoleStub.returns(Promise.resolve());

      getServiceStub.returns(Promise.resolve(fullService));
      createServiceStub.returns(Promise.resolve(fullService));
      getBucketStub.returns(Promise.resolve({
        name: 'sls-my-service',
        region: 'cn-shanghai'
      }));
      createBucketStub.returns(Promise.resolve());
      uploadObjectStub.returns(Promise.resolve());
      getFunctionStub
        .withArgs('my-service-dev', 'my-service-dev-postTest')
        .returns(Promise.resolve(functions[0]));
      getFunctionStub
        .withArgs('my-service-dev', 'my-service-dev-getTest')
        .returns(Promise.resolve(functions[1]));
      updateFunctionStub.returns(Promise.resolve());
      createFunctionStub.returns(Promise.resolve());

      getApiGroupStub.returns(Promise.resolve(fullGroup));
      createApiGroupStub.returns(Promise.resolve());
      getApisStub.returns(Promise.resolve(fullApis));
      createApiStub.returns(Promise.resolve());
      updateApiStub.returns(Promise.resolve(fullApis[1]));
      deployApiStub.returns(Promise.resolve());

      getTriggerStub.returns(Promise.resolve());

      const logs = [
        'Packaging function: postTest...',
        'Compiling function "postTest"...',
        'Log project sls-accountid-logs already exists.',
        'Log store sls-accountid-logs/my-service-dev already exists.',
        'Log store sls-accountid-logs/my-service-dev already has an index.',
        'RAM role sls-my-service-dev-exec-role exists.',
        'RAM policy fc-my-service-dev-access exists.',
        'RAM policy fc-my-service-dev-access has been attached to sls-my-service-dev-exec-role.',
        'Service my-service-dev already exists.',
        'Bucket sls-accountid already exists.',
        'Uploading serverless/my-service/dev/1500622721413-2017-07-21T07:38:41.413Z/postTest.zip to OSS bucket sls-accountid...',
        'Uploaded serverless/my-service/dev/1500622721413-2017-07-21T07:38:41.413Z/postTest.zip to OSS bucket sls-accountid',
        'Updating function my-service-dev-postTest...',
        'Updated function my-service-dev-postTest',
        'RAM role sls-my-service-dev-invoke-role exists.',
        'RAM policy AliyunFCInvocationAccess has been attached to sls-my-service-dev-invoke-role.',
        'API group my_service_dev_api exists.',
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
