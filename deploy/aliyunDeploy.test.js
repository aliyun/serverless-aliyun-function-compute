'use strict';

const sinon = require('sinon');
const BbPromise = require('bluebird');
const path = require('path');
const fs = require('fs');
const {
  apiGroup, apis, group, fullGroup, role,
  fullRole, execRole, fullExecRole, fullApis,
  functions, logIndex, fullLogIndex, logProject,
  fullLogProject, logStore, fullLogStore, fullService,
  triggers, fullTriggers
} = require('../test/data');

const AliyunProvider = require('../provider/aliyunProvider');
const AliyunDeploy = require('./aliyunDeploy');
const Serverless = require('../test/serverless');

describe('AliyunDeploy', () => {
  let serverless;
  let aliyunDeploy;

  beforeEach(() => {
    serverless = new Serverless();
    serverless.service.service = 'my-service';
    serverless.service.package = {
      artifactFilePath: '/some-remote-file-path',
      artifact: 'artifact.zip'
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
    };
    beforeEach(() => {
      serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
      aliyunDeploy = new AliyunDeploy(serverless, options);
    })

    it('should set the serverless instance', () => {
      expect(aliyunDeploy.serverless).toEqual(serverless);
    });

    it('should set options if provided', () => {
      expect(aliyunDeploy.options).toEqual(options);
    });

    it('should make the provider accessible', () => {
      expect(aliyunDeploy.provider).toBeInstanceOf(AliyunProvider);
    });

    describe('hooks', () => {
      let validateStub;
      let setDefaultsStub;
      let loadTemplatesStub;
      let setupServiceStub;
      let uploadArtifactsStub;
      let setupFunctionsStub;
      let setupEventsStub;

      beforeEach(() => {
        validateStub = sinon.stub(aliyunDeploy, 'validate')
          .returns(BbPromise.resolve());
        setDefaultsStub = sinon.stub(aliyunDeploy, 'setDefaults')
          .returns(BbPromise.resolve());
        loadTemplatesStub = sinon.stub(aliyunDeploy, 'loadTemplates')
          .returns(BbPromise.resolve());
        setupServiceStub = sinon.stub(aliyunDeploy, 'setupService')
          .returns(BbPromise.resolve());
        uploadArtifactsStub = sinon.stub(aliyunDeploy, 'uploadArtifacts')
          .returns(BbPromise.resolve());
        setupFunctionsStub = sinon.stub(aliyunDeploy, 'setupFunctions')
          .returns(BbPromise.resolve());
        setupEventsStub = sinon.stub(aliyunDeploy, 'setupEvents')
          .returns(BbPromise.resolve());
      });

      afterEach(() => {
        aliyunDeploy.validate.restore();
        aliyunDeploy.setDefaults.restore();
        aliyunDeploy.loadTemplates.restore();
        aliyunDeploy.setupService.restore();
        aliyunDeploy.uploadArtifacts.restore();
        aliyunDeploy.setupFunctions.restore();
        aliyunDeploy.setupEvents.restore();
      });

      it('should run "before:deploy:deploy" promise chain', () => aliyunDeploy
        .hooks['before:deploy:deploy']().then(() => {
          expect(validateStub.calledOnce).toEqual(true);
          expect(setDefaultsStub.calledAfter(validateStub)).toEqual(true);
          expect(loadTemplatesStub.calledAfter(setDefaultsStub)).toEqual(true);
        }));

      it('should run "deploy:deploy" promise chain', () => aliyunDeploy
        .hooks['deploy:deploy']().then(() => {
          expect(setupServiceStub.calledOnce).toEqual(true);
          expect(uploadArtifactsStub.calledAfter(setupServiceStub)).toEqual(true);
          expect(setupFunctionsStub.calledAfter(uploadArtifactsStub)).toEqual(true);
          expect(setupEventsStub.calledAfter(setupFunctionsStub)).toEqual(true);
        }));
    });
  });

  describe('#deploy()', () => {
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
    let updateTriggerStub;
    let createTriggerStub;

    const options = {
      stage: 'dev',
      region: 'cn-shanghai',
    };

    beforeEach(() => {
      serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
      aliyunDeploy = new AliyunDeploy(serverless, options);
      consoleLogStub = sinon.stub(aliyunDeploy.serverless.cli, 'log').returns();

      getLogProjectStub = sinon.stub(aliyunDeploy.provider, 'getLogProject');
      createLogProjectStub = sinon.stub(aliyunDeploy.provider, 'createLogProject');
      getLogStoreStub = sinon.stub(aliyunDeploy.provider, 'getLogStore');
      createLogStoreStub = sinon.stub(aliyunDeploy.provider, 'createLogStore');
      getLogIndexStub = sinon.stub(aliyunDeploy.provider, 'getLogIndex');
      createLogIndexStub = sinon.stub(aliyunDeploy.provider, 'createLogIndex');

      getRoleStub = sinon.stub(aliyunDeploy.provider, 'getRole');
      createRoleStub = sinon.stub(aliyunDeploy.provider, 'createRole');
      getPolicyStub = sinon.stub(aliyunDeploy.provider, 'getPolicy');
      createPolicyStub = sinon.stub(aliyunDeploy.provider, 'createPolicy');
      getPoliciesForRoleStub = sinon.stub(aliyunDeploy.provider, 'getPoliciesForRole');
      attachPolicyToRoleStub = sinon.stub(aliyunDeploy.provider, 'attachPolicyToRole');

      getServiceStub = sinon.stub(aliyunDeploy.provider, 'getService');
      createServiceStub = sinon.stub(aliyunDeploy.provider, 'createService');
      getBucketStub = sinon.stub(aliyunDeploy.provider, 'getBucket');
      createBucketStub = sinon.stub(aliyunDeploy.provider, 'createBucket');
      uploadObjectStub = sinon.stub(aliyunDeploy.provider, 'uploadObject');
      getFunctionStub = sinon.stub(aliyunDeploy.provider, 'getFunction');
      updateFunctionStub = sinon.stub(aliyunDeploy.provider, 'updateFunction');
      createFunctionStub = sinon.stub(aliyunDeploy.provider, 'createFunction');

      getTriggerStub = sinon.stub(aliyunDeploy.provider, 'getTrigger');
      updateTriggerStub = sinon.stub(aliyunDeploy.provider, 'updateTrigger');
      createTriggerStub = sinon.stub(aliyunDeploy.provider, 'createTrigger');

      getApiGroupStub = sinon.stub(aliyunDeploy.provider, 'getApiGroup');
      createApiGroupStub = sinon.stub(aliyunDeploy.provider, 'createApiGroup');
      getApisStub = sinon.stub(aliyunDeploy.provider, 'getApis');
      updateApiStub = sinon.stub(aliyunDeploy.provider, 'updateApi');
      createApiStub = sinon.stub(aliyunDeploy.provider, 'createApi');
      deployApiStub = sinon.stub(aliyunDeploy.provider, 'deployApi');
    });

    afterEach(() => {
      aliyunDeploy.serverless.cli.log.restore();

      aliyunDeploy.provider.getLogProject.restore();
      aliyunDeploy.provider.createLogProject.restore();
      aliyunDeploy.provider.getLogStore.restore();
      aliyunDeploy.provider.createLogStore.restore();
      aliyunDeploy.provider.getLogIndex.restore();
      aliyunDeploy.provider.createLogIndex.restore();

      aliyunDeploy.provider.getRole.restore();
      aliyunDeploy.provider.createRole.restore();
      aliyunDeploy.provider.getPoliciesForRole.restore();
      aliyunDeploy.provider.getPolicy.restore();
      aliyunDeploy.provider.createPolicy.restore();

      aliyunDeploy.provider.getService.restore();
      aliyunDeploy.provider.createService.restore();
      aliyunDeploy.provider.getBucket.restore();
      aliyunDeploy.provider.createBucket.restore();
      aliyunDeploy.provider.uploadObject.restore();
      aliyunDeploy.provider.getFunction.restore();
      aliyunDeploy.provider.updateFunction.restore();
      aliyunDeploy.provider.createFunction.restore();

      aliyunDeploy.provider.getTrigger.restore();
      aliyunDeploy.provider.updateTrigger.restore();
      aliyunDeploy.provider.createTrigger.restore();

      aliyunDeploy.provider.getApiGroup.restore();
      aliyunDeploy.provider.createApiGroup.restore();
      aliyunDeploy.provider.getApis.restore();
      aliyunDeploy.provider.updateApi.restore();
      aliyunDeploy.provider.createApi.restore();
      aliyunDeploy.provider.deployApi.restore();
    });

    it('should set up service from scratch', () => {
      getLogProjectStub.returns(BbPromise.resolve(undefined));
      createLogProjectStub.returns(BbPromise.resolve(fullLogProject));
      getLogStoreStub.returns(BbPromise.resolve(undefined));
      createLogStoreStub.returns(BbPromise.resolve(fullLogStore));
      getLogIndexStub.returns(BbPromise.resolve(undefined));
      createLogIndexStub.returns(BbPromise.resolve(fullLogIndex));

      getRoleStub.returns(BbPromise.resolve(undefined));
      createRoleStub.onCall(0).returns(BbPromise.resolve(fullExecRole));
      createRoleStub.onCall(1).returns(BbPromise.resolve(fullRole));
      getPolicyStub.returns(BbPromise.resolve(undefined));
      createPolicyStub.returns(BbPromise.resolve({}));
      getPoliciesForRoleStub.returns(BbPromise.resolve([]));
      attachPolicyToRoleStub.returns(BbPromise.resolve());

      getServiceStub.returns(BbPromise.resolve(undefined));
      createServiceStub.returns(BbPromise.resolve(fullService));
      getBucketStub.returns(BbPromise.resolve(undefined));
      createBucketStub.returns(BbPromise.resolve());
      uploadObjectStub.returns(BbPromise.resolve());
      getFunctionStub.returns(BbPromise.resolve(undefined));
      updateFunctionStub.returns(BbPromise.resolve());
      createFunctionStub.returns(BbPromise.resolve());
      getApiGroupStub.returns(BbPromise.resolve(undefined));
      createApiGroupStub.returns(BbPromise.resolve(fullGroup));

      getTriggerStub.returns(BbPromise.resolve());
      updateTriggerStub.returns(BbPromise.resolve());
      createTriggerStub.returns(BbPromise.resolve(fullTriggers[0]));

      getApisStub.returns(BbPromise.resolve([]));
      updateApiStub.returns(BbPromise.resolve());
      createApiStub.onCall(0).returns(BbPromise.resolve(fullApis[0]));
      createApiStub.onCall(1).returns(BbPromise.resolve(fullApis[1]));
      deployApiStub.returns(BbPromise.resolve());

      return aliyunDeploy.hooks['before:deploy:deploy']()
        .then(() => aliyunDeploy.hooks['deploy:deploy']())
        .then(() => {
          const logs = [
            'Creating log project sls-my-service-logs...',
            'Created log project sls-my-service-logs',
            'Creating log store sls-my-service-logs/my-service-dev...',
            'Created log store sls-my-service-logs/my-service-dev',
            'Creating log index for sls-my-service-logs/my-service-dev...',
            'Created log index for sls-my-service-logs/my-service-dev',
            'Creating RAM role sls-my-service-dev-exec-role...',
            'Created RAM role sls-my-service-dev-exec-role',
            'Creating RAM policy fc-my-service-dev-access...',
            'Created RAM policy fc-my-service-dev-access',
            'Attaching RAM policy fc-my-service-dev-access to sls-my-service-dev-exec-role...',
            'Attached RAM policy fc-my-service-dev-access to sls-my-service-dev-exec-role',
            'Creating service my-service-dev...',
            'Created service my-service-dev',
            'Creating bucket sls-my-service...',
            'Created bucket sls-my-service',
            'Uploading serverless/my-service/dev/1500622721413-2017-07-21T07:38:41.413Z/my-service.zip to OSS bucket sls-my-service...',
            'Uploaded serverless/my-service/dev/1500622721413-2017-07-21T07:38:41.413Z/my-service.zip to OSS bucket sls-my-service',
            'Creating function my-service-dev-postTest...',
            'Created function my-service-dev-postTest',
            'Creating function my-service-dev-getTest...',
            'Created function my-service-dev-getTest',
            'Creating function my-service-dev-ossTriggerTest...',
            'Created function my-service-dev-ossTriggerTest',
            'Creating RAM role sls-my-service-dev-invoke-role...',
            'Created RAM role sls-my-service-dev-invoke-role',
            'Attaching RAM policy AliyunFCInvocationAccess to sls-my-service-dev-invoke-role...',
            'Attached RAM policy AliyunFCInvocationAccess to sls-my-service-dev-invoke-role',
            'Creating API group my_service_dev_api...',
            'Created API group my_service_dev_api',
            'Creating API sls_http_my_service_dev_postTest...',
            'Created API sls_http_my_service_dev_postTest',
            'Creating API sls_http_my_service_dev_getTest...',
            'Created API sls_http_my_service_dev_getTest',
            'Deploying API sls_http_my_service_dev_postTest...',
            'Deployed API sls_http_my_service_dev_postTest',
            'POST http://523e8dc7bbe04613b5b1d726c2a7889d-cn-shanghai.alicloudapi.com/baz -> my-service-dev.my-service-dev-postTest',
            'Deploying API sls_http_my_service_dev_getTest...',
            'Deployed API sls_http_my_service_dev_getTest',
            'GET http://523e8dc7bbe04613b5b1d726c2a7889d-cn-shanghai.alicloudapi.com/quo -> my-service-dev.my-service-dev-getTest',
            'Creating trigger sls_oss_my_service_dev_ossTriggerTest...',
            'Created trigger sls_oss_my_service_dev_ossTriggerTest'
          ];
          for (var i = 0; i < consoleLogStub.callCount; ++i) {
            expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
          }
        });
    });

    it('should handle existing service ', () => {
      getLogProjectStub.returns(BbPromise.resolve(fullLogProject));
      createLogProjectStub.returns(BbPromise.resolve());
      getLogStoreStub.returns(BbPromise.resolve(fullLogStore));
      createLogStoreStub.returns(BbPromise.resolve());
      getLogIndexStub.returns(BbPromise.resolve(fullLogIndex));
      createLogIndexStub.returns(BbPromise.resolve());

      getRoleStub.onCall(0).returns(BbPromise.resolve(fullExecRole));
      getRoleStub.onCall(1).returns(BbPromise.resolve(fullRole));
      createRoleStub.returns(BbPromise.resolve());
      getPolicyStub.returns(BbPromise.resolve({
        PolicyType: 'Custom',
        PolicyName: execRole.Policies[0].PolicyName
      }));
      createPolicyStub.returns(BbPromise.resolve({}));
      getPoliciesForRoleStub.onCall(0).returns(BbPromise.resolve(execRole.Policies));
      getPoliciesForRoleStub.onCall(1).returns(BbPromise.resolve(role.Policies));
      attachPolicyToRoleStub.returns(BbPromise.resolve());

      getServiceStub.returns(BbPromise.resolve(fullService));
      createServiceStub.returns(BbPromise.resolve(fullService));
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
        getFunctionStub
          .withArgs('my-service-dev', 'my-service-dev-ossTriggerTest')
          .returns(BbPromise.resolve(functions[2]));
      updateFunctionStub.returns(BbPromise.resolve());
      createFunctionStub.returns(BbPromise.resolve());

      getTriggerStub.returns(BbPromise.resolve(fullTriggers[0]));
      updateTriggerStub.returns(BbPromise.resolve(fullTriggers[0]));
      createTriggerStub.returns(BbPromise.resolve());

      getApiGroupStub.returns(BbPromise.resolve(fullGroup));
      createApiGroupStub.returns(BbPromise.resolve());
      getApisStub.returns(BbPromise.resolve(fullApis));
      createApiStub.returns(BbPromise.resolve());
      updateApiStub.onCall(0).returns(BbPromise.resolve(fullApis[0]));
      updateApiStub.onCall(1).returns(BbPromise.resolve(fullApis[1]));
      deployApiStub.returns(BbPromise.resolve());

      const logs = [
        'Log project sls-my-service-logs already exists.',
        'Log store sls-my-service-logs/my-service-dev already exists.',
        'Log store sls-my-service-logs/my-service-dev already has an index.',
        'RAM role sls-my-service-dev-exec-role exists.',
        'RAM policy fc-my-service-dev-access exists.',
        'RAM policy fc-my-service-dev-access has been attached to sls-my-service-dev-exec-role.',
        'Service my-service-dev already exists.',
        'Bucket sls-my-service already exists.',
        'Uploading serverless/my-service/dev/1500622721413-2017-07-21T07:38:41.413Z/my-service.zip to OSS bucket sls-my-service...',
        'Uploaded serverless/my-service/dev/1500622721413-2017-07-21T07:38:41.413Z/my-service.zip to OSS bucket sls-my-service',
        'Updating function my-service-dev-postTest...',
        'Updated function my-service-dev-postTest',
        'Updating function my-service-dev-getTest...',
        'Updated function my-service-dev-getTest',
        'Updating function my-service-dev-ossTriggerTest...',
        'Updated function my-service-dev-ossTriggerTest',
        'RAM role sls-my-service-dev-invoke-role exists.',
        'RAM policy AliyunFCInvocationAccess has been attached to sls-my-service-dev-invoke-role.',
        'API group my_service_dev_api exists.',
        'Updating API sls_http_my_service_dev_postTest...',
        'Updated API sls_http_my_service_dev_postTest',
        'Updating API sls_http_my_service_dev_getTest...',
        'Updated API sls_http_my_service_dev_getTest',
        'Deploying API sls_http_my_service_dev_postTest...',
        'Deployed API sls_http_my_service_dev_postTest',
        'POST http://523e8dc7bbe04613b5b1d726c2a7889d-cn-shanghai.alicloudapi.com/baz -> my-service-dev.my-service-dev-postTest',
        'Deploying API sls_http_my_service_dev_getTest...',
        'Deployed API sls_http_my_service_dev_getTest',
        'GET http://523e8dc7bbe04613b5b1d726c2a7889d-cn-shanghai.alicloudapi.com/quo -> my-service-dev.my-service-dev-getTest',
        'Updating trigger sls_oss_my_service_dev_ossTriggerTest...',
        'Updated trigger sls_oss_my_service_dev_ossTriggerTest'
      ];
      return aliyunDeploy.hooks['before:deploy:deploy']()
        .then(() => aliyunDeploy.hooks['deploy:deploy']())
        .then(() => {
          for (var i = 0; i < consoleLogStub.callCount; ++i) {
            expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
          }
        });
    });
  });
});
