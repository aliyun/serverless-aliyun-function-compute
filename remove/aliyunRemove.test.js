'use strict';

const sinon = require('sinon');
const BbPromise = require('bluebird');
const path = require('path');

const AliyunProvider = require('../provider/aliyunProvider');
const AliyunRemove = require('./aliyunRemove');
const Serverless = require('../test/serverless');
const { apiGroup, apis, group, fullGroup, role, fullRole, execRole, fullExecRole, fullApis, functions, fullFunctions, bucket, objects, functionDefs } = require('../test/data');

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
      let removeEventsStub;
      let removeFunctionsAndServiceStub;
      let removeArtifactsStub;

      beforeEach(() => {
        validateStub = sinon.stub(aliyunRemove, 'validate')
          .returns(BbPromise.resolve());
        setDefaultsStub = sinon.stub(aliyunRemove, 'setDefaults')
          .returns(BbPromise.resolve());
        removeEventsStub = sinon.stub(aliyunRemove, 'removeEvents')
          .returns(BbPromise.resolve());
        removeFunctionsAndServiceStub = sinon.stub(aliyunRemove, 'removeFunctionsAndService')
          .returns(BbPromise.resolve());
        removeArtifactsStub = sinon.stub(aliyunRemove, 'removeArtifacts')
          .returns(BbPromise.resolve());
      });

      afterEach(() => {
        aliyunRemove.validate.restore();
        aliyunRemove.setDefaults.restore();
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
          expect(removeEventsStub.calledOnce).toEqual(true);
          expect(removeFunctionsAndServiceStub.calledAfter(removeEventsStub)).toEqual(true);
          expect(removeArtifactsStub.calledAfter(removeFunctionsAndServiceStub)).toEqual(true);
        }));
    });
  });

  describe('remove --remove-roles', () => {
    let consoleLogStub;

    let getApiGroupStub;
    let getApisStub;
    let getDeployedApisStub;
    let abolishApiStub;
    let deleteApiStub;
    let deleteApiGroupStub;

    let getRoleStub;
    let getPoliciesForRoleStub;
    let detachPolicyFromRoleStub;
    let deleteRoleStub;

    let getServiceStub;
    let getFunctionsStub;
    let deleteFunctionStub;
    let deleteServiceStub;
    let removeRoleAndPoliciesStub;

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

      getApiGroupStub = sinon.stub(aliyunRemove.provider, 'getApiGroup');
      getApisStub = sinon.stub(aliyunRemove.provider, 'getApis');
      getDeployedApisStub = sinon.stub(aliyunRemove.provider, 'getDeployedApis');
      abolishApiStub = sinon.stub(aliyunRemove.provider, 'abolishApi');
      deleteApiStub = sinon.stub(aliyunRemove.provider, 'deleteApi');
      deleteApiGroupStub = sinon.stub(aliyunRemove.provider, 'deleteApiGroup');

      getRoleStub = sinon.stub(aliyunRemove.provider, 'getRole');
      getPoliciesForRoleStub = sinon.stub(aliyunRemove.provider, 'getPoliciesForRole');
      detachPolicyFromRoleStub = sinon.stub(aliyunRemove.provider, 'detachPolicyFromRole');
      deleteRoleStub = sinon.stub(aliyunRemove.provider, 'deleteRole');

      getServiceStub = sinon.stub(aliyunRemove.provider, 'getService');
      getFunctionsStub = sinon.stub(aliyunRemove.provider, 'getFunctions');
      deleteFunctionStub = sinon.stub(aliyunRemove.provider, 'deleteFunction');
      deleteServiceStub = sinon.stub(aliyunRemove.provider, 'deleteService');

      getBucketStub = sinon.stub(aliyunRemove.provider, 'getBucket');
      getObjectsStub = sinon.stub(aliyunRemove.provider, 'getObjects');
      deleteObjectsStub = sinon.stub(aliyunRemove.provider, 'deleteObjects');
      deleteBucketStub = sinon.stub(aliyunRemove.provider, 'deleteBucket');
    });

    afterEach(() => {
      aliyunRemove.serverless.cli.log.restore();

      aliyunRemove.provider.getApiGroup.restore();
      aliyunRemove.provider.getApis.restore();
      aliyunRemove.provider.getDeployedApis.restore();
      aliyunRemove.provider.abolishApi.restore();
      aliyunRemove.provider.deleteApi.restore();
      aliyunRemove.provider.deleteApiGroup.restore();

      aliyunRemove.provider.getRole.restore();
      aliyunRemove.provider.getPoliciesForRole.restore();
      aliyunRemove.provider.detachPolicyFromRole.restore();
      aliyunRemove.provider.deleteRole.restore();

      aliyunRemove.provider.getService.restore();
      aliyunRemove.provider.getFunctions.restore();
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

        'Detaching RAM policy AliyunFCInvocationAccess from sls-my-service-dev-invoke-role...',
        'Detached RAM policy AliyunFCInvocationAccess from sls-my-service-dev-invoke-role',
        'Removing RAM role sls-my-service-dev-invoke-role...',
        'Removed RAM role sls-my-service-dev-invoke-role',

        'Removing functions...',
        'Removing function my-service-dev-postTest of service my-service-dev...',
        'Removed function my-service-dev-postTest of service my-service-dev',
        'Removing function my-service-dev-getTest of service my-service-dev...',
        'Removed function my-service-dev-getTest of service my-service-dev',
        'Removing service my-service-dev...',
        'Removed service my-service-dev',

        'Detaching RAM policy fc-access-sls-my-service-dev-logs from sls-my-service-dev-exec-role...',
        'Detached RAM policy fc-access-sls-my-service-dev-logs from sls-my-service-dev-exec-role',
        'Removing RAM role sls-my-service-dev-exec-role...',
        'Removed RAM role sls-my-service-dev-exec-role',

        'Removing 3 artifacts in OSS bucket sls-my-service...',
        'Removed 3 artifacts in OSS bucket sls-my-service',
        'Removing OSS bucket sls-my-service...',
        'Removed OSS bucket sls-my-service'
      ];

      aliyunRemove.serverless.service.functions = functionDefs;
      getApiGroupStub.returns(BbPromise.resolve(fullGroup));
      getApisStub.returns(BbPromise.resolve(fullApis));
      getDeployedApisStub.returns(BbPromise.resolve(fullApis));
      abolishApiStub.returns(BbPromise.resolve());
      deleteApiStub.returns(BbPromise.resolve());
      deleteApiGroupStub.returns(BbPromise.resolve());

      getRoleStub.withArgs(role.RoleName).returns(BbPromise.resolve(fullRole));
      getRoleStub.withArgs(execRole.RoleName).returns(BbPromise.resolve(fullExecRole));

      getPoliciesForRoleStub.withArgs(role.RoleName).returns(BbPromise.resolve(role.Policies));
      getPoliciesForRoleStub.withArgs(execRole.RoleName).returns(BbPromise.resolve(execRole.Policies));

      detachPolicyFromRoleStub.returns(BbPromise.resolve());
      deleteRoleStub.returns(BbPromise.resolve());

      const serviceId = new Date().getTime().toString(16);
      getServiceStub.returns(BbPromise.resolve({
        serviceId: serviceId,
        serviceName: 'my-service-dev'
      }));
      getFunctionsStub.returns(BbPromise.resolve(fullFunctions));
      deleteFunctionStub.returns(BbPromise.resolve());
      deleteServiceStub.returns(BbPromise.resolve());

      getBucketStub.returns(BbPromise.resolve(bucket));
      getObjectsStub.returns(BbPromise.resolve(objects));
      deleteObjectsStub.returns(BbPromise.resolve());
      deleteBucketStub.returns(BbPromise.resolve());

      return aliyunRemove.hooks['before:remove:remove']()
        .then(() => aliyunRemove.hooks['remove:remove']())
        .then(() => {
          expect(consoleLogStub.callCount).toEqual(logs.length);
          for (var i = 0; i < consoleLogStub.callCount; ++i) {
            expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
          }
        });
    });

    it('should hanlde undeployed service ', () => {
      const logs = [
        'Removing events...',
        'No deployed APIs to abolish.',
        'No APIs to remove.',
        'No API groups to remove.',

        'Removing functions...',
        'No functions to remove.',
        'No services to remove.',

        'No artifacts to remove.',
        'No buckets to remove.'
      ];

      aliyunRemove.serverless.service.functions = functionDefs;
      getApiGroupStub.returns(BbPromise.resolve(undefined));
      getApisStub.returns(BbPromise.resolve([]));
      getDeployedApisStub.returns(BbPromise.resolve([]));
      abolishApiStub.returns(BbPromise.resolve());
      deleteApiStub.returns(BbPromise.resolve());
      deleteApiGroupStub.returns(BbPromise.resolve());

      getRoleStub.returns(BbPromise.resolve());
      getPoliciesForRoleStub.returns(BbPromise.resolve([]));
      detachPolicyFromRoleStub.returns(BbPromise.resolve());
      deleteRoleStub.returns(BbPromise.resolve());

      getServiceStub.returns(BbPromise.resolve(undefined));
      getFunctionsStub.returns(BbPromise.resolve([]));
      deleteFunctionStub.returns(BbPromise.resolve());
      deleteServiceStub.returns(BbPromise.resolve());

      getBucketStub.returns(BbPromise.resolve(undefined));
      getObjectsStub.returns(BbPromise.resolve([]));
      deleteObjectsStub.returns(BbPromise.resolve());
      deleteBucketStub.returns(BbPromise.resolve());

      return aliyunRemove.hooks['before:remove:remove']()
        .then(() => aliyunRemove.hooks['remove:remove']())
        .then(() => {
          expect(consoleLogStub.callCount).toEqual(logs.length);
          for (var i = 0; i < consoleLogStub.callCount; ++i) {
            expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
          }
        });
    });
  });

  describe('remove', () => {
    let consoleLogStub;

    let getApiGroupStub;
    let getApisStub;
    let getDeployedApisStub;
    let abolishApiStub;
    let deleteApiStub;
    let deleteApiGroupStub;

    let getRoleStub;
    let getPoliciesForRoleStub;
    let detachPolicyFromRoleStub;
    let deleteRoleStub;

    let getServiceStub;
    let getFunctionsStub;
    let deleteFunctionStub;
    let deleteServiceStub;
    let removeRoleAndPoliciesStub;

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

      getApiGroupStub = sinon.stub(aliyunRemove.provider, 'getApiGroup');
      getApisStub = sinon.stub(aliyunRemove.provider, 'getApis');
      getDeployedApisStub = sinon.stub(aliyunRemove.provider, 'getDeployedApis');
      abolishApiStub = sinon.stub(aliyunRemove.provider, 'abolishApi');
      deleteApiStub = sinon.stub(aliyunRemove.provider, 'deleteApi');
      deleteApiGroupStub = sinon.stub(aliyunRemove.provider, 'deleteApiGroup');

      getRoleStub = sinon.stub(aliyunRemove.provider, 'getRole');
      getPoliciesForRoleStub = sinon.stub(aliyunRemove.provider, 'getPoliciesForRole');
      detachPolicyFromRoleStub = sinon.stub(aliyunRemove.provider, 'detachPolicyFromRole');
      deleteRoleStub = sinon.stub(aliyunRemove.provider, 'deleteRole');

      getServiceStub = sinon.stub(aliyunRemove.provider, 'getService');
      getFunctionsStub = sinon.stub(aliyunRemove.provider, 'getFunctions');
      deleteFunctionStub = sinon.stub(aliyunRemove.provider, 'deleteFunction');
      deleteServiceStub = sinon.stub(aliyunRemove.provider, 'deleteService');

      getBucketStub = sinon.stub(aliyunRemove.provider, 'getBucket');
      getObjectsStub = sinon.stub(aliyunRemove.provider, 'getObjects');
      deleteObjectsStub = sinon.stub(aliyunRemove.provider, 'deleteObjects');
      deleteBucketStub = sinon.stub(aliyunRemove.provider, 'deleteBucket');
    });

    afterEach(() => {
      aliyunRemove.serverless.cli.log.restore();

      aliyunRemove.provider.getApiGroup.restore();
      aliyunRemove.provider.getApis.restore();
      aliyunRemove.provider.getDeployedApis.restore();
      aliyunRemove.provider.abolishApi.restore();
      aliyunRemove.provider.deleteApi.restore();
      aliyunRemove.provider.deleteApiGroup.restore();

      aliyunRemove.provider.getRole.restore();
      aliyunRemove.provider.getPoliciesForRole.restore();
      aliyunRemove.provider.detachPolicyFromRole.restore();
      aliyunRemove.provider.deleteRole.restore();

      aliyunRemove.provider.getService.restore();
      aliyunRemove.provider.getFunctions.restore();
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

        'Removing functions...',
        'Removing function my-service-dev-postTest of service my-service-dev...',
        'Removed function my-service-dev-postTest of service my-service-dev',
        'Removing function my-service-dev-getTest of service my-service-dev...',
        'Removed function my-service-dev-getTest of service my-service-dev',
        'Removing service my-service-dev...',
        'Removed service my-service-dev',

        'Removing 3 artifacts in OSS bucket sls-my-service...',
        'Removed 3 artifacts in OSS bucket sls-my-service',
        'Removing OSS bucket sls-my-service...',
        'Removed OSS bucket sls-my-service'
      ];

      aliyunRemove.serverless.service.functions = functionDefs;
      getApiGroupStub.returns(BbPromise.resolve(fullGroup));
      getApisStub.returns(BbPromise.resolve(fullApis));
      getDeployedApisStub.returns(BbPromise.resolve(fullApis));
      abolishApiStub.returns(BbPromise.resolve());
      deleteApiStub.returns(BbPromise.resolve());
      deleteApiGroupStub.returns(BbPromise.resolve());

      getRoleStub.returns(BbPromise.resolve());
      getPoliciesForRoleStub.returns(BbPromise.resolve());
      detachPolicyFromRoleStub.returns(BbPromise.resolve());
      deleteRoleStub.returns(BbPromise.resolve());

      const serviceId = new Date().getTime().toString(16);
      getServiceStub.returns(BbPromise.resolve({
        serviceId: serviceId,
        serviceName: 'my-service-dev'
      }));
      getFunctionsStub.returns(BbPromise.resolve(fullFunctions));
      deleteFunctionStub.returns(BbPromise.resolve());
      deleteServiceStub.returns(BbPromise.resolve());

      getBucketStub.returns(BbPromise.resolve(bucket));
      getObjectsStub.returns(BbPromise.resolve(objects));
      deleteObjectsStub.returns(BbPromise.resolve());
      deleteBucketStub.returns(BbPromise.resolve());

      return aliyunRemove.hooks['before:remove:remove']()
        .then(() => aliyunRemove.hooks['remove:remove']())
        .then(() => {
          expect(consoleLogStub.callCount).toEqual(logs.length);
          for (var i = 0; i < consoleLogStub.callCount; ++i) {
            expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
          }
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

        'Removing functions...',
        'No functions to remove.',
        'No services to remove.',

        'No artifacts to remove.',
        'No buckets to remove.'
      ];

      aliyunRemove.serverless.service.functions = functionDefs;
      getApiGroupStub.returns(BbPromise.resolve(undefined));
      getApisStub.returns(BbPromise.resolve([]));
      getDeployedApisStub.returns(BbPromise.resolve([]));
      abolishApiStub.returns(BbPromise.resolve());
      deleteApiStub.returns(BbPromise.resolve());
      deleteApiGroupStub.returns(BbPromise.resolve());

      getRoleStub.returns(BbPromise.resolve());
      getPoliciesForRoleStub.returns(BbPromise.resolve([]));
      detachPolicyFromRoleStub.returns(BbPromise.resolve());
      deleteRoleStub.returns(BbPromise.resolve());

      getServiceStub.returns(BbPromise.resolve(undefined));
      getFunctionsStub.returns(BbPromise.resolve([]));
      deleteFunctionStub.returns(BbPromise.resolve());
      deleteServiceStub.returns(BbPromise.resolve());

      getBucketStub.returns(BbPromise.resolve(undefined));
      getObjectsStub.returns(BbPromise.resolve([]));
      deleteObjectsStub.returns(BbPromise.resolve());
      deleteBucketStub.returns(BbPromise.resolve());

      return aliyunRemove.hooks['before:remove:remove']()
        .then(() => aliyunRemove.hooks['remove:remove']())
        .then(() => {
          expect(consoleLogStub.callCount).toEqual(logs.length);
          for (var i = 0; i < consoleLogStub.callCount; ++i) {
            expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
          }
          expect(getRoleStub.called).toEqual(false);
          expect(getPoliciesForRoleStub.called).toEqual(false);
          expect(detachPolicyFromRoleStub.called).toEqual(false);
          expect(deleteRoleStub.called).toEqual(false);
        });
    });
  });
});
