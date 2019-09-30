/*global beforeEach, afterEach, expect*/

'use strict';

const sinon = require('sinon');
const path = require('path');
const {
  fullGroup, role,
  fullRole, execRole, fullExecRole, fullApis,
  functions, fullLogIndex,
  fullLogProject, fullLogStore, fullService,
  fullTriggers
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
    });

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
          .returns(Promise.resolve());
        setDefaultsStub = sinon.stub(aliyunDeploy, 'setDefaults')
          .returns();
        loadTemplatesStub = sinon.stub(aliyunDeploy, 'loadTemplates')
          .returns(Promise.resolve());
        setupServiceStub = sinon.stub(aliyunDeploy, 'setupService')
          .returns(Promise.resolve());
        uploadArtifactsStub = sinon.stub(aliyunDeploy, 'uploadArtifacts')
          .returns(Promise.resolve());
        setupFunctionsStub = sinon.stub(aliyunDeploy, 'setupFunctions')
          .returns(Promise.resolve());
        setupEventsStub = sinon.stub(aliyunDeploy, 'setupEvents')
          .returns(Promise.resolve());
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

    let projectDelayStub;
    let storeDelayStub;

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

      projectDelayStub = sinon.stub(aliyunDeploy.provider, 'projectDelay');
      storeDelayStub = sinon.stub(aliyunDeploy.provider, 'storeDelay');
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

      projectDelayStub.restore();
      storeDelayStub.restore();
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

      getTriggerStub.returns(Promise.resolve());
      updateTriggerStub.returns(Promise.resolve());
      createTriggerStub.returns(Promise.resolve(fullTriggers[0]));

      getApisStub.returns(Promise.resolve([]));
      updateApiStub.returns(Promise.resolve());
      createApiStub.onCall(0).returns(Promise.resolve(fullApis[0]));
      createApiStub.onCall(1).returns(Promise.resolve(fullApis[1]));
      deployApiStub.returns(Promise.resolve());

      projectDelayStub.get(() => 0);
      storeDelayStub.get(() => 0);

      return aliyunDeploy.hooks['before:deploy:deploy']()
        .then(() => aliyunDeploy.hooks['deploy:deploy']())
        .then(() => {
          const logs = [
            'Creating log project sls-accountid-cn-shanghai-logs...',
            'Created log project sls-accountid-cn-shanghai-logs',
            'Creating log store sls-accountid-cn-shanghai-logs/my-service-dev...',
            'Created log store sls-accountid-cn-shanghai-logs/my-service-dev',
            'Creating log index for sls-accountid-cn-shanghai-logs/my-service-dev...',
            'Created log index for sls-accountid-cn-shanghai-logs/my-service-dev',
            'Creating RAM role sls-my-service-dev-cn-shanghai-exec-role...',
            'Created RAM role sls-my-service-dev-cn-shanghai-exec-role',
            'Creating RAM policy fc-my-service-dev-cn-shanghai-access...',
            'Created RAM policy fc-my-service-dev-cn-shanghai-access',
            'Attaching RAM policy fc-my-service-dev-cn-shanghai-access to sls-my-service-dev-cn-shanghai-exec-role...',
            'Attached RAM policy fc-my-service-dev-cn-shanghai-access to sls-my-service-dev-cn-shanghai-exec-role',
            'Creating service my-service-dev...',
            'Created service my-service-dev',
            'Creating bucket sls-accountid-cn-shanghai...',
            'Created bucket sls-accountid-cn-shanghai',
            'Uploading serverless/my-service/dev/1500622721413-2017-07-21T07:38:41.413Z/my-service.zip to OSS bucket sls-accountid-cn-shanghai...',
            'Uploaded serverless/my-service/dev/1500622721413-2017-07-21T07:38:41.413Z/my-service.zip to OSS bucket sls-accountid-cn-shanghai',
            'Creating function my-service-dev-postTest...',
            'Created function my-service-dev-postTest',
            'Creating function my-service-dev-getTest...',
            'Created function my-service-dev-getTest',
            'Creating function my-service-dev-ossTriggerTest...',
            'Created function my-service-dev-ossTriggerTest',
            'Creating RAM role sls-my-service-dev-cn-shanghai-invoke-role...',
            'Created RAM role sls-my-service-dev-cn-shanghai-invoke-role',
            'Attaching RAM policy AliyunFCInvocationAccess to sls-my-service-dev-cn-shanghai-invoke-role...',
            'Attached RAM policy AliyunFCInvocationAccess to sls-my-service-dev-cn-shanghai-invoke-role',
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
      getFunctionStub
        .withArgs('my-service-dev', 'my-service-dev-ossTriggerTest')
        .returns(Promise.resolve(functions[2]));
      updateFunctionStub.returns(Promise.resolve());
      createFunctionStub.returns(Promise.resolve());

      getTriggerStub.returns(Promise.resolve(fullTriggers[0]));
      updateTriggerStub.returns(Promise.resolve(fullTriggers[0]));
      createTriggerStub.returns(Promise.resolve());

      getApiGroupStub.returns(Promise.resolve(fullGroup));
      createApiGroupStub.returns(Promise.resolve());
      getApisStub.returns(Promise.resolve(fullApis));
      createApiStub.returns(Promise.resolve());
      updateApiStub.onCall(0).returns(Promise.resolve(fullApis[0]));
      updateApiStub.onCall(1).returns(Promise.resolve(fullApis[1]));
      deployApiStub.returns(Promise.resolve());

      projectDelayStub.get(() => 0);
      storeDelayStub.get(() => 0);

      const logs = [
        'Log project sls-accountid-cn-shanghai-logs already exists.',
        'Log store sls-accountid-cn-shanghai-logs/my-service-dev already exists.',
        'Log store sls-accountid-cn-shanghai-logs/my-service-dev already has an index.',
        'RAM role sls-my-service-dev-cn-shanghai-exec-role exists.',
        'RAM policy fc-my-service-dev-cn-shanghai-access exists.',
        'RAM policy fc-my-service-dev-cn-shanghai-access has been attached to sls-my-service-dev-cn-shanghai-exec-role.',
        'Service my-service-dev already exists.',
        'Bucket sls-accountid-cn-shanghai already exists.',
        'Uploading serverless/my-service/dev/1500622721413-2017-07-21T07:38:41.413Z/my-service.zip to OSS bucket sls-accountid-cn-shanghai...',
        'Uploaded serverless/my-service/dev/1500622721413-2017-07-21T07:38:41.413Z/my-service.zip to OSS bucket sls-accountid-cn-shanghai',
        'Updating function my-service-dev-postTest...',
        'Updated function my-service-dev-postTest',
        'Updating function my-service-dev-getTest...',
        'Updated function my-service-dev-getTest',
        'Updating function my-service-dev-ossTriggerTest...',
        'Updated function my-service-dev-ossTriggerTest',
        'RAM role sls-my-service-dev-cn-shanghai-invoke-role exists.',
        'RAM policy AliyunFCInvocationAccess has been attached to sls-my-service-dev-cn-shanghai-invoke-role.',
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
