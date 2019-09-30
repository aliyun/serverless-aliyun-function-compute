/*global beforeEach, afterEach, expect*/

'use strict';

const sinon = require('sinon');
const path = require('path');

const AliyunProvider = require('../provider/aliyunProvider');
const AliyunRemove = require('./aliyunRemove');
const Serverless = require('../test/serverless');
const {
  fullGroup, role, fullRole, execRole,
  fullExecRole, fullApis, fullFunctions, bucket,
  objects, functionDefs, fullService, fullTriggers
} = require('../test/data');

describe('AliyunRemove', () => {
  let serverless;
  let options;
  let aliyunRemove;

  beforeEach(() => {
    serverless = new Serverless();
    options = {
      stage: 'my-stage',
      region: 'my-region',
      'remove-roles': true
    };
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
    serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
    serverless.pluginManager.setCliOptions(options);
    aliyunRemove = new AliyunRemove(serverless, options);
  });

  describe('#constructor()', () => {
    it('should set the serverless instance', () => {
      expect(aliyunRemove.serverless).toEqual(serverless);
    });

    it('should set options if provided', () => {
      expect(aliyunRemove.options).toEqual(options);
    });

    it('should make the provider accessible', () => {
      expect(aliyunRemove.provider).toBeInstanceOf(AliyunProvider);
    });

    describe('hooks', () => {
      let validateStub;
      let setDefaultsStub;
      let getFunctionsAndServiceStub;
      let removeEventsStub;
      let removeFunctionsAndServiceStub;
      let removeArtifactsStub;

      beforeEach(() => {
        validateStub = sinon.stub(aliyunRemove, 'validate')
          .returns(Promise.resolve());
        setDefaultsStub = sinon.stub(aliyunRemove, 'setDefaults')
          .returns();
        getFunctionsAndServiceStub = sinon.stub(aliyunRemove, 'getFunctionsAndService')
          .returns(Promise.resolve());
        removeEventsStub = sinon.stub(aliyunRemove, 'removeEvents')
          .returns(Promise.resolve());
        removeFunctionsAndServiceStub = sinon.stub(aliyunRemove, 'removeFunctionsAndService')
          .returns(Promise.resolve());
        removeArtifactsStub = sinon.stub(aliyunRemove, 'removeArtifacts')
          .returns(Promise.resolve());
      });

      afterEach(() => {
        aliyunRemove.validate.restore();
        aliyunRemove.setDefaults.restore();
        aliyunRemove.getFunctionsAndService.restore();
        aliyunRemove.removeEvents.restore();
        aliyunRemove.removeFunctionsAndService.restore();
        aliyunRemove.removeArtifacts.restore();
      });

      it('should run "before:remove:remove" promise chain', () => aliyunRemove
        .hooks['before:remove:remove']().then(() => {
          expect(validateStub.calledOnce).toEqual(true);
          expect(setDefaultsStub.calledAfter(validateStub)).toEqual(true);
        }));

      it('should run "remove:remove" promise chain', () => aliyunRemove
        .hooks['remove:remove']().then(() => {
          expect(getFunctionsAndServiceStub.calledOnce).toEqual(true);
          expect(removeEventsStub.calledAfter(getFunctionsAndServiceStub)).toEqual(true);
          expect(removeFunctionsAndServiceStub.calledAfter(removeEventsStub)).toEqual(true);
          expect(removeArtifactsStub.calledAfter(removeFunctionsAndServiceStub)).toEqual(true);
        }));
    });
  });

  describe('remove --remove-roles', () => {
    let consoleLogStub;

    let getServiceStub;
    let getFunctionsStub;

    let getApiGroupStub;
    let getApisStub;
    let getDeployedApisStub;
    let abolishApiStub;
    let deleteApiStub;
    let deleteApiGroupStub;

    let listTriggersStub;
    let deleteTriggerStub;

    let getRoleStub;
    let getPoliciesForRoleStub;
    let detachPolicyFromRoleStub;
    let deleteRoleStub;

    let deleteFunctionStub;
    let deleteServiceStub;

    let getBucketStub;
    let getObjectsStub;
    let deleteObjectsStub;
    let deleteBucketStub;

    const options = {
      stage: 'dev',
      region: 'cn-shanghai',
      'remove-roles': true
    };

    beforeEach(() => {
      serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
      aliyunRemove = new AliyunRemove(serverless, options);
      consoleLogStub = sinon.stub(aliyunRemove.serverless.cli, 'log').returns();

      getServiceStub = sinon.stub(aliyunRemove.provider, 'getService');
      getFunctionsStub = sinon.stub(aliyunRemove.provider, 'getFunctions');

      getApiGroupStub = sinon.stub(aliyunRemove.provider, 'getApiGroup');
      getApisStub = sinon.stub(aliyunRemove.provider, 'getApis');
      getDeployedApisStub = sinon.stub(aliyunRemove.provider, 'getDeployedApis');
      abolishApiStub = sinon.stub(aliyunRemove.provider, 'abolishApi');
      deleteApiStub = sinon.stub(aliyunRemove.provider, 'deleteApi');
      deleteApiGroupStub = sinon.stub(aliyunRemove.provider, 'deleteApiGroup');

      listTriggersStub = sinon.stub(aliyunRemove.provider, 'listTriggers');
      deleteTriggerStub = sinon.stub(aliyunRemove.provider, 'deleteTrigger');

      getRoleStub = sinon.stub(aliyunRemove.provider, 'getRole');
      getPoliciesForRoleStub = sinon.stub(aliyunRemove.provider, 'getPoliciesForRole');
      detachPolicyFromRoleStub = sinon.stub(aliyunRemove.provider, 'detachPolicyFromRole');
      deleteRoleStub = sinon.stub(aliyunRemove.provider, 'deleteRole');

      deleteFunctionStub = sinon.stub(aliyunRemove.provider, 'deleteFunction');
      deleteServiceStub = sinon.stub(aliyunRemove.provider, 'deleteService');

      getBucketStub = sinon.stub(aliyunRemove.provider, 'getBucket');
      getObjectsStub = sinon.stub(aliyunRemove.provider, 'getObjects');
      deleteObjectsStub = sinon.stub(aliyunRemove.provider, 'deleteObjects');
      deleteBucketStub = sinon.stub(aliyunRemove.provider, 'deleteBucket');
    });

    afterEach(() => {
      aliyunRemove.serverless.cli.log.restore();

      aliyunRemove.provider.getService.restore();
      aliyunRemove.provider.getFunctions.restore();

      aliyunRemove.provider.getApiGroup.restore();
      aliyunRemove.provider.getApis.restore();
      aliyunRemove.provider.getDeployedApis.restore();
      aliyunRemove.provider.abolishApi.restore();
      aliyunRemove.provider.deleteApi.restore();
      aliyunRemove.provider.deleteApiGroup.restore();

      aliyunRemove.provider.listTriggers.restore();
      aliyunRemove.provider.deleteTrigger.restore();

      aliyunRemove.provider.getRole.restore();
      aliyunRemove.provider.getPoliciesForRole.restore();
      aliyunRemove.provider.detachPolicyFromRole.restore();
      aliyunRemove.provider.deleteRole.restore();

      aliyunRemove.provider.deleteFunction.restore();
      aliyunRemove.provider.deleteService.restore();

      aliyunRemove.provider.getBucket.restore();
      aliyunRemove.provider.getObjects.restore();
      aliyunRemove.provider.deleteObjects.restore();
      aliyunRemove.provider.deleteBucket.restore();
    });

    it('should remove existing service', () => {
      const logs = [
        'Removing events...',
        'Abolishing API sls_http_my_service_dev_postTest...',
        'Abolished API sls_http_my_service_dev_postTest',
        'Abolishing API sls_http_my_service_dev_getTest...',
        'Abolished API sls_http_my_service_dev_getTest',
        'Removing API sls_http_my_service_dev_postTest...',
        'Removed API sls_http_my_service_dev_postTest',
        'Removing API sls_http_my_service_dev_getTest...',
        'Removed API sls_http_my_service_dev_getTest',
        'Removing API group my_service_dev_api...',
        'Removed API group my_service_dev_api',
        'Removing trigger sls_oss_my_service_dev_ossTriggerTest...',
        'Removed trigger sls_oss_my_service_dev_ossTriggerTest',
        'Detaching RAM policy AliyunFCInvocationAccess from sls-my-service-dev-cn-shanghai-invoke-role...',
        'Detached RAM policy AliyunFCInvocationAccess from sls-my-service-dev-cn-shanghai-invoke-role',
        'Removing RAM role sls-my-service-dev-cn-shanghai-invoke-role...',
        'Removed RAM role sls-my-service-dev-cn-shanghai-invoke-role',

        'Removing functions...',
        'Removing function my-service-dev-postTest of service my-service-dev...',
        'Removed function my-service-dev-postTest of service my-service-dev',
        'Removing function my-service-dev-getTest of service my-service-dev...',
        'Removed function my-service-dev-getTest of service my-service-dev',
        'Removing function my-service-dev-ossTriggerTest of service my-service-dev...',
        'Removed function my-service-dev-ossTriggerTest of service my-service-dev',
        'Removing service my-service-dev...',
        'Removed service my-service-dev',

        'Detaching RAM policy fc-my-service-dev-cn-shanghai-access from sls-my-service-dev-cn-shanghai-exec-role...',
        'Detached RAM policy fc-my-service-dev-cn-shanghai-access from sls-my-service-dev-cn-shanghai-exec-role',
        'Removing RAM role sls-my-service-dev-cn-shanghai-exec-role...',
        'Removed RAM role sls-my-service-dev-cn-shanghai-exec-role',

        'Removing 3 artifacts in OSS bucket sls-accountid-cn-shanghai...',
        'Removed 3 artifacts in OSS bucket sls-accountid-cn-shanghai',
        'Removing OSS bucket sls-accountid-cn-shanghai...',
        'Removed OSS bucket sls-accountid-cn-shanghai'
      ];

      aliyunRemove.serverless.service.functions = functionDefs;

      getServiceStub.returns(Promise.resolve(fullService));
      getFunctionsStub.returns(Promise.resolve(fullFunctions));

      getApiGroupStub.returns(Promise.resolve(fullGroup));
      getApisStub.returns(Promise.resolve(fullApis));
      getDeployedApisStub.returns(Promise.resolve(fullApis));
      abolishApiStub.returns(Promise.resolve());
      deleteApiStub.returns(Promise.resolve());
      deleteApiGroupStub.returns(Promise.resolve());

      listTriggersStub
        .withArgs('my-service-dev', 'my-service-dev-getTest')
        .returns(Promise.resolve([]));
      listTriggersStub
        .withArgs('my-service-dev', 'my-service-dev-postTest')
        .returns(Promise.resolve([]));
      listTriggersStub
        .withArgs('my-service-dev', 'my-service-dev-ossTriggerTest')
        .returns(Promise.resolve(fullTriggers));
      deleteTriggerStub.returns(Promise.resolve());

      getRoleStub.withArgs(role.RoleName).returns(Promise.resolve(fullRole));
      getRoleStub.withArgs(execRole.RoleName).returns(Promise.resolve(fullExecRole));

      getPoliciesForRoleStub.withArgs(role.RoleName).returns(Promise.resolve(role.Policies));
      getPoliciesForRoleStub.withArgs(execRole.RoleName).returns(Promise.resolve(execRole.Policies));

      detachPolicyFromRoleStub.returns(Promise.resolve());
      deleteRoleStub.returns(Promise.resolve());

      deleteFunctionStub.returns(Promise.resolve());
      deleteServiceStub.returns(Promise.resolve());

      getBucketStub.returns(Promise.resolve(bucket));
      getObjectsStub.returns(Promise.resolve(objects));
      deleteObjectsStub.returns(Promise.resolve());
      deleteBucketStub.returns(Promise.resolve());

      return aliyunRemove.hooks['before:remove:remove']()
        .then(() => aliyunRemove.hooks['remove:remove']())
        .then(() => {
          for (var i = 0; i < consoleLogStub.callCount; ++i) {
            expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
          }
          expect(consoleLogStub.callCount).toEqual(logs.length);
        });
    });

    it('should hanlde undeployed service ', () => {
      const logs = [
        'Removing events...',
        'No deployed APIs to abolish.',
        'No APIs to remove.',
        'No API groups to remove.',
        'No triggers to remove.',

        'Removing functions...',
        'No functions to remove.',
        'No services to remove.',

        'No artifacts to remove.',
        'No buckets to remove.'
      ];

      aliyunRemove.serverless.service.functions = functionDefs;

      getServiceStub.returns(Promise.resolve(undefined));
      getFunctionsStub.returns(Promise.resolve([]));

      getApiGroupStub.returns(Promise.resolve(undefined));
      getApisStub.returns(Promise.resolve([]));
      getDeployedApisStub.returns(Promise.resolve([]));
      abolishApiStub.returns(Promise.resolve());
      deleteApiStub.returns(Promise.resolve());
      deleteApiGroupStub.returns(Promise.resolve());

      listTriggersStub.returns(Promise.resolve([]));
      deleteTriggerStub.returns(Promise.resolve());

      getRoleStub.returns(Promise.resolve());
      getPoliciesForRoleStub.returns(Promise.resolve([]));
      detachPolicyFromRoleStub.returns(Promise.resolve());
      deleteRoleStub.returns(Promise.resolve());

      deleteFunctionStub.returns(Promise.resolve());
      deleteServiceStub.returns(Promise.resolve());

      getBucketStub.returns(Promise.resolve(undefined));
      getObjectsStub.returns(Promise.resolve([]));
      deleteObjectsStub.returns(Promise.resolve());
      deleteBucketStub.returns(Promise.resolve());

      return aliyunRemove.hooks['before:remove:remove']()
        .then(() => aliyunRemove.hooks['remove:remove']())
        .then(() => {
          for (var i = 0; i < consoleLogStub.callCount; ++i) {
            expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
          }
          expect(consoleLogStub.callCount).toEqual(logs.length);
        });
    });
  });

  describe('remove', () => {
    let consoleLogStub;

    let getServiceStub;
    let getFunctionsStub;

    let getApiGroupStub;
    let getApisStub;
    let getDeployedApisStub;
    let abolishApiStub;
    let deleteApiStub;
    let deleteApiGroupStub;

    let listTriggersStub;
    let deleteTriggerStub;

    let getRoleStub;
    let getPoliciesForRoleStub;
    let detachPolicyFromRoleStub;
    let deleteRoleStub;

    let deleteFunctionStub;
    let deleteServiceStub;

    let getBucketStub;
    let getObjectsStub;
    let deleteObjectsStub;
    let deleteBucketStub;

    const options = {
      stage: 'dev',
      region: 'cn-shanghai'
    };

    beforeEach(() => {
      serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
      aliyunRemove = new AliyunRemove(serverless, options);
      consoleLogStub = sinon.stub(aliyunRemove.serverless.cli, 'log').returns();

      getServiceStub = sinon.stub(aliyunRemove.provider, 'getService');
      getFunctionsStub = sinon.stub(aliyunRemove.provider, 'getFunctions');

      getApiGroupStub = sinon.stub(aliyunRemove.provider, 'getApiGroup');
      getApisStub = sinon.stub(aliyunRemove.provider, 'getApis');
      getDeployedApisStub = sinon.stub(aliyunRemove.provider, 'getDeployedApis');
      abolishApiStub = sinon.stub(aliyunRemove.provider, 'abolishApi');
      deleteApiStub = sinon.stub(aliyunRemove.provider, 'deleteApi');
      deleteApiGroupStub = sinon.stub(aliyunRemove.provider, 'deleteApiGroup');

      listTriggersStub = sinon.stub(aliyunRemove.provider, 'listTriggers');
      deleteTriggerStub = sinon.stub(aliyunRemove.provider, 'deleteTrigger');

      getRoleStub = sinon.stub(aliyunRemove.provider, 'getRole');
      getPoliciesForRoleStub = sinon.stub(aliyunRemove.provider, 'getPoliciesForRole');
      detachPolicyFromRoleStub = sinon.stub(aliyunRemove.provider, 'detachPolicyFromRole');
      deleteRoleStub = sinon.stub(aliyunRemove.provider, 'deleteRole');

      deleteFunctionStub = sinon.stub(aliyunRemove.provider, 'deleteFunction');
      deleteServiceStub = sinon.stub(aliyunRemove.provider, 'deleteService');

      getBucketStub = sinon.stub(aliyunRemove.provider, 'getBucket');
      getObjectsStub = sinon.stub(aliyunRemove.provider, 'getObjects');
      deleteObjectsStub = sinon.stub(aliyunRemove.provider, 'deleteObjects');
      deleteBucketStub = sinon.stub(aliyunRemove.provider, 'deleteBucket');
    });

    afterEach(() => {
      aliyunRemove.serverless.cli.log.restore();

      aliyunRemove.provider.getService.restore();
      aliyunRemove.provider.getFunctions.restore();

      aliyunRemove.provider.getApiGroup.restore();
      aliyunRemove.provider.getApis.restore();
      aliyunRemove.provider.getDeployedApis.restore();
      aliyunRemove.provider.abolishApi.restore();
      aliyunRemove.provider.deleteApi.restore();
      aliyunRemove.provider.deleteApiGroup.restore();

      aliyunRemove.provider.listTriggers.restore();
      aliyunRemove.provider.deleteTrigger.restore();

      aliyunRemove.provider.getRole.restore();
      aliyunRemove.provider.getPoliciesForRole.restore();
      aliyunRemove.provider.detachPolicyFromRole.restore();
      aliyunRemove.provider.deleteRole.restore();

      aliyunRemove.provider.deleteFunction.restore();
      aliyunRemove.provider.deleteService.restore();

      aliyunRemove.provider.getBucket.restore();
      aliyunRemove.provider.getObjects.restore();
      aliyunRemove.provider.deleteObjects.restore();
      aliyunRemove.provider.deleteBucket.restore();
    });

    it('should remove existing service', () => {
      const logs = [
        'Removing events...',
        'Abolishing API sls_http_my_service_dev_postTest...',
        'Abolished API sls_http_my_service_dev_postTest',
        'Abolishing API sls_http_my_service_dev_getTest...',
        'Abolished API sls_http_my_service_dev_getTest',
        'Removing API sls_http_my_service_dev_postTest...',
        'Removed API sls_http_my_service_dev_postTest',
        'Removing API sls_http_my_service_dev_getTest...',
        'Removed API sls_http_my_service_dev_getTest',
        'Removing API group my_service_dev_api...',
        'Removed API group my_service_dev_api',
        'Removing trigger sls_oss_my_service_dev_ossTriggerTest...',
        'Removed trigger sls_oss_my_service_dev_ossTriggerTest',
        'Removing functions...',
        'Removing function my-service-dev-postTest of service my-service-dev...',
        'Removed function my-service-dev-postTest of service my-service-dev',
        'Removing function my-service-dev-getTest of service my-service-dev...',
        'Removed function my-service-dev-getTest of service my-service-dev',
        'Removing function my-service-dev-ossTriggerTest of service my-service-dev...',
        'Removed function my-service-dev-ossTriggerTest of service my-service-dev',
        'Removing service my-service-dev...',
        'Removed service my-service-dev',
        'Removing 3 artifacts in OSS bucket sls-accountid-cn-shanghai...',
        'Removed 3 artifacts in OSS bucket sls-accountid-cn-shanghai',
        'Removing OSS bucket sls-accountid-cn-shanghai...',
        'Removed OSS bucket sls-accountid-cn-shanghai'
      ];

      aliyunRemove.serverless.service.functions = functionDefs;

      getServiceStub.returns(Promise.resolve(fullService));
      getFunctionsStub.returns(Promise.resolve(fullFunctions));

      getApiGroupStub.returns(Promise.resolve(fullGroup));
      getApisStub.returns(Promise.resolve(fullApis));
      getDeployedApisStub.returns(Promise.resolve(fullApis));
      abolishApiStub.returns(Promise.resolve());
      deleteApiStub.returns(Promise.resolve());
      deleteApiGroupStub.returns(Promise.resolve());

      listTriggersStub
        .withArgs('my-service-dev', 'my-service-dev-getTest')
        .returns(Promise.resolve([]));
      listTriggersStub
        .withArgs('my-service-dev', 'my-service-dev-postTest')
        .returns(Promise.resolve([]));
      listTriggersStub
        .withArgs('my-service-dev', 'my-service-dev-ossTriggerTest')
        .returns(Promise.resolve(fullTriggers));
      deleteTriggerStub.returns(Promise.resolve());

      getRoleStub.returns(Promise.resolve());
      getPoliciesForRoleStub.returns(Promise.resolve());
      detachPolicyFromRoleStub.returns(Promise.resolve());
      deleteRoleStub.returns(Promise.resolve());

      deleteFunctionStub.returns(Promise.resolve());
      deleteServiceStub.returns(Promise.resolve());

      getBucketStub.returns(Promise.resolve(bucket));
      getObjectsStub.returns(Promise.resolve(objects));
      deleteObjectsStub.returns(Promise.resolve());
      deleteBucketStub.returns(Promise.resolve());

      return aliyunRemove.hooks['before:remove:remove']()
        .then(() => aliyunRemove.hooks['remove:remove']())
        .then(() => {
          for (var i = 0; i < consoleLogStub.callCount; ++i) {
            expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
          }
          expect(consoleLogStub.callCount).toEqual(logs.length);
          expect(getRoleStub.called).toEqual(false);
          expect(getPoliciesForRoleStub.called).toEqual(false);
          expect(detachPolicyFromRoleStub.called).toEqual(false);
          expect(deleteRoleStub.called).toEqual(false);
        });
    });

    it('should hanlde undeployed service ', () => {
      const logs = [
        'Removing events...',
        'No deployed APIs to abolish.',
        'No APIs to remove.',
        'No API groups to remove.',
        'No triggers to remove.',

        'Removing functions...',
        'No functions to remove.',
        'No services to remove.',

        'No artifacts to remove.',
        'No buckets to remove.'
      ];

      aliyunRemove.serverless.service.functions = functionDefs;

      getServiceStub.returns(Promise.resolve(undefined));
      getFunctionsStub.returns(Promise.resolve([]));

      getApiGroupStub.returns(Promise.resolve(undefined));
      getApisStub.returns(Promise.resolve([]));
      getDeployedApisStub.returns(Promise.resolve([]));
      abolishApiStub.returns(Promise.resolve());
      deleteApiStub.returns(Promise.resolve());
      deleteApiGroupStub.returns(Promise.resolve());

      listTriggersStub.returns(Promise.resolve([]));
      deleteTriggerStub.returns(Promise.resolve());

      getRoleStub.returns(Promise.resolve());
      getPoliciesForRoleStub.returns(Promise.resolve([]));
      detachPolicyFromRoleStub.returns(Promise.resolve());
      deleteRoleStub.returns(Promise.resolve());

      deleteFunctionStub.returns(Promise.resolve());
      deleteServiceStub.returns(Promise.resolve());

      getBucketStub.returns(Promise.resolve(undefined));
      getObjectsStub.returns(Promise.resolve([]));
      deleteObjectsStub.returns(Promise.resolve());
      deleteBucketStub.returns(Promise.resolve());

      return aliyunRemove.hooks['before:remove:remove']()
        .then(() => aliyunRemove.hooks['remove:remove']())
        .then(() => {
          for (var i = 0; i < consoleLogStub.callCount; ++i) {
            expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
          }
          expect(consoleLogStub.callCount).toEqual(logs.length);
          expect(getRoleStub.called).toEqual(false);
          expect(getPoliciesForRoleStub.called).toEqual(false);
          expect(detachPolicyFromRoleStub.called).toEqual(false);
          expect(deleteRoleStub.called).toEqual(false);
        });
    });
  });
});
