/*global beforeEach, afterEach, expect*/

'use strict';

const sinon = require('sinon');
const path = require('path');

const AliyunProvider = require('../../provider/aliyunProvider');
const AliyunRemove = require('../aliyunRemove');
const Serverless = require('../../test/serverless');
const {
  fullGroup, fullApis, functionDefs, fullFunctions, fullService, fullTriggers
} = require('../../test/data');

describe('removeApisIfNeeded', () => {
  let serverless;
  let aliyunRemove;

  beforeEach(() => {
    serverless = new Serverless();
    serverless.service.service = 'my-service';
    serverless.service.provider = {
      name: 'aliyun',
      credentials: path.join(__dirname, '..', '..', 'test', 'credentials')
    };
    serverless.config = {
      servicePath: path.join(__dirname, '..', '..', 'test')
    };
    const options = {
      stage: 'dev',
      region: 'cn-shanghai',
    };
    serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
    serverless.pluginManager.setCliOptions(options);
    aliyunRemove = new AliyunRemove(serverless, options);
  });

  describe('#removeApisIfNeeded()', () => {
    let removeApisIfNeededStub;
    let removeTriggersIfNeededStub;
    let removeInvokeRoleStub;

    beforeEach(() => {
      removeApisIfNeededStub = sinon.stub(aliyunRemove, 'removeApisIfNeeded')
        .returns(Promise.resolve());
      removeTriggersIfNeededStub = sinon.stub(aliyunRemove, 'removeTriggersIfNeeded')
        .returns(Promise.resolve());
      removeInvokeRoleStub = sinon.stub(aliyunRemove, 'removeInvokeRole')
        .returns(Promise.resolve());
    });

    afterEach(() => {
      aliyunRemove.removeApisIfNeeded.restore();
      aliyunRemove.removeTriggersIfNeeded.restore();
      aliyunRemove.removeInvokeRole.restore();
    });

    it('should run promise chain', () => aliyunRemove
      .removeEvents().then(() => {
        expect(removeApisIfNeededStub.calledOnce).toEqual(true);
        expect(removeTriggersIfNeededStub.calledAfter(removeApisIfNeededStub));
        expect(removeInvokeRoleStub.calledAfter(removeTriggersIfNeededStub));
      })
    );

    it('should set apis and triggers property', () => {
      return aliyunRemove.removeEvents().then(() => {
        expect(aliyunRemove.apiGroup).toEqual(undefined);
        expect(aliyunRemove.deployedApis).toEqual([]);
        expect(aliyunRemove.apis).toEqual([]);
        expect(aliyunRemove.triggers).toEqual([]);
      });
    });
  });

  describe('#removeInvokeRole()', () => {
    let removeRoleAndPoliciesStub;

    beforeEach(() => {
      removeRoleAndPoliciesStub = sinon.stub(aliyunRemove, 'removeRoleAndPolicies').returns(Promise.resolve());
    });

    afterEach(() => {
      aliyunRemove.removeRoleAndPolicies.restore();
    });

    it('should remove invoke role', () => {
      return aliyunRemove.removeInvokeRole().then(() => {
        expect(removeRoleAndPoliciesStub.calledOnce).toEqual(true);
        expect(removeRoleAndPoliciesStub.calledWithExactly('sls-my-service-dev-invoke-role')).toEqual(true);
      });
    });
  });

  describe('#removeApisIfNeeded()', () => {
    let consoleLogStub;
    let getApiGroupStub;
    let getApisStub;
    let getDeployedApisStub;
    let abolishApiStub;
    let deleteApiStub;
    let deleteApiGroupStub;

    beforeEach(() => {
      aliyunRemove.serverless.service.functions = {};
      consoleLogStub = sinon.stub(aliyunRemove.serverless.cli, 'log').returns();
      getApiGroupStub = sinon.stub(aliyunRemove.provider, 'getApiGroup');
      getApisStub = sinon.stub(aliyunRemove.provider, 'getApis');
      getDeployedApisStub = sinon.stub(aliyunRemove.provider, 'getDeployedApis');
      abolishApiStub = sinon.stub(aliyunRemove.provider, 'abolishApi');
      deleteApiStub = sinon.stub(aliyunRemove.provider, 'deleteApi');
      deleteApiGroupStub = sinon.stub(aliyunRemove.provider, 'deleteApiGroup');

      aliyunRemove.apiGroup = undefined;
      aliyunRemove.apis = [];
      aliyunRemove.deployedApis = [];
      aliyunRemove.triggers = [];
    });

    afterEach(() => {
      aliyunRemove.serverless.cli.log.restore();
      aliyunRemove.provider.getApiGroup.restore();
      aliyunRemove.provider.getApis.restore();
      aliyunRemove.provider.getDeployedApis.restore();
      aliyunRemove.provider.abolishApi.restore();
      aliyunRemove.provider.deleteApi.restore();
      aliyunRemove.provider.deleteApiGroup.restore();
    });

    it('should remove existing events', () => {
      aliyunRemove.serverless.service.functions = functionDefs;
      getApiGroupStub.returns(Promise.resolve(fullGroup));
      getApisStub.returns(Promise.resolve(fullApis));
      getDeployedApisStub.returns(Promise.resolve(fullApis));
      abolishApiStub.returns(Promise.resolve());
      deleteApiStub.returns(Promise.resolve());
      deleteApiGroupStub.returns(Promise.resolve());

      return aliyunRemove.removeApisIfNeeded().then(() => {
        expect(getApiGroupStub.calledOnce).toEqual(true);
        expect(getApiGroupStub.calledWithExactly('my_service_dev_api')).toEqual(true);

        expect(getApisStub.calledAfter(getApiGroupStub)).toEqual(true);
        expect(getApisStub.calledOnce).toEqual(true);
        expect(getApisStub.calledWithExactly({
          GroupId: fullGroup.GroupId
        })).toEqual(true);

        expect(getDeployedApisStub.calledAfter(getApisStub)).toEqual(true);
        expect(getDeployedApisStub.calledOnce).toEqual(true);
        expect(getDeployedApisStub.calledWithExactly({
          GroupId: fullGroup.GroupId
        })).toEqual(true);

        expect(abolishApiStub.calledAfter(getDeployedApisStub)).toEqual(true);
        expect(abolishApiStub.calledTwice).toEqual(true);
        expect(abolishApiStub.getCall(0).args)
          .toEqual([ fullGroup, fullApis[0] ]);
        expect(abolishApiStub.getCall(1).args)
          .toEqual([ fullGroup, fullApis[1] ]);

        expect(deleteApiStub.calledAfter(abolishApiStub)).toEqual(true);
        expect(deleteApiStub.calledTwice).toEqual(true);
        expect(deleteApiStub.getCall(0).args)
          .toEqual([ fullGroup, fullApis[0] ]);
        expect(deleteApiStub.getCall(1).args)
          .toEqual([ fullGroup, fullApis[1] ]);

        expect(deleteApiGroupStub.calledAfter(deleteApiStub)).toEqual(true);
        expect(deleteApiGroupStub.calledOnce).toEqual(true);
        expect(deleteApiGroupStub.calledWithExactly(fullGroup)).toEqual(true);

        const logs = [
          'Abolishing API sls_http_my_service_dev_postTest...',
          'Abolished API sls_http_my_service_dev_postTest',
          'Abolishing API sls_http_my_service_dev_getTest...',
          'Abolished API sls_http_my_service_dev_getTest',
          'Removing API sls_http_my_service_dev_postTest...',
          'Removed API sls_http_my_service_dev_postTest',
          'Removing API sls_http_my_service_dev_getTest...',
          'Removed API sls_http_my_service_dev_getTest',
          'Removing API group my_service_dev_api...',
          'Removed API group my_service_dev_api'
        ];
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
        }
      });
    });

    it('should only abolish deployed apis', () => {
      aliyunRemove.serverless.service.functions = functionDefs;
      getApiGroupStub.returns(Promise.resolve(fullGroup));
      getApisStub.returns(Promise.resolve(fullApis));
      getDeployedApisStub.returns(Promise.resolve([fullApis[0]]));
      abolishApiStub.returns(Promise.resolve());
      deleteApiStub.returns(Promise.resolve());
      deleteApiGroupStub.returns(Promise.resolve());

      return aliyunRemove.removeApisIfNeeded().then(() => {
        expect(abolishApiStub.calledAfter(getDeployedApisStub)).toEqual(true);
        expect(abolishApiStub.calledOnce).toEqual(true);
        expect(abolishApiStub.getCall(0).args)
          .toEqual([ fullGroup, fullApis[0] ]);

        expect(deleteApiStub.calledAfter(abolishApiStub)).toEqual(true);
        expect(deleteApiStub.calledTwice).toEqual(true);
        expect(deleteApiStub.getCall(0).args)
          .toEqual([ fullGroup, fullApis[0] ]);
        expect(deleteApiStub.getCall(1).args)
          .toEqual([ fullGroup, fullApis[1] ]);

        expect(deleteApiGroupStub.calledAfter(deleteApiStub)).toEqual(true);
        expect(deleteApiGroupStub.calledOnce).toEqual(true);
        expect(deleteApiGroupStub.calledWithExactly(fullGroup)).toEqual(true);

        const logs = [
          'Abolishing API sls_http_my_service_dev_postTest...',
          'Abolished API sls_http_my_service_dev_postTest',
          'Removing API sls_http_my_service_dev_postTest...',
          'Removed API sls_http_my_service_dev_postTest',
          'Removing API sls_http_my_service_dev_getTest...',
          'Removed API sls_http_my_service_dev_getTest',
          'Removing API group my_service_dev_api...',
          'Removed API group my_service_dev_api'
        ];
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
        }
      });
    });

    it('should only delete existing apis', () => {
      aliyunRemove.serverless.service.functions = functionDefs;
      getApiGroupStub.returns(Promise.resolve(fullGroup));
      getApisStub.returns(Promise.resolve([fullApis[0]]));
      getDeployedApisStub.returns(Promise.resolve([]));
      abolishApiStub.returns(Promise.resolve());
      deleteApiStub.returns(Promise.resolve());
      deleteApiGroupStub.returns(Promise.resolve());

      return aliyunRemove.removeApisIfNeeded().then(() => {
        expect(abolishApiStub.called).toEqual(false);
        expect(deleteApiStub.calledOnce).toEqual(true);
        expect(deleteApiStub.getCall(0).args)
          .toEqual([ fullGroup, fullApis[0] ]);

        expect(deleteApiGroupStub.calledAfter(deleteApiStub)).toEqual(true);
        expect(deleteApiGroupStub.calledOnce).toEqual(true);
        expect(deleteApiGroupStub.calledWithExactly(fullGroup)).toEqual(true);

        const logs = [
          'No deployed APIs to abolish.',
          'Removing API sls_http_my_service_dev_postTest...',
          'Removed API sls_http_my_service_dev_postTest',
          'Removing API group my_service_dev_api...',
          'Removed API group my_service_dev_api'
        ];
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
        }
      });
    });

    it('should not do anything if no apis have been setup before', () => {
      aliyunRemove.serverless.service.functions = functionDefs;
      getApiGroupStub.returns(Promise.resolve(undefined));
      getApisStub.returns(Promise.resolve([]));
      getDeployedApisStub.returns(Promise.resolve([]));
      abolishApiStub.returns(Promise.resolve());
      deleteApiStub.returns(Promise.resolve());
      deleteApiGroupStub.returns(Promise.resolve());

      return aliyunRemove.removeApisIfNeeded().then(() => {
        expect(abolishApiStub.called).toEqual(false);
        expect(deleteApiStub.called).toEqual(false);
        expect(deleteApiGroupStub.called).toEqual(false);

        const logs = [
          'No deployed APIs to abolish.',
          'No APIs to remove.',
          'No API groups to remove.',
        ];
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
        }
      });
    });
  });

  describe('#removeTriggersIfNeeded()', () => {
    let listTriggersStub;
    let deleteTriggerStub;
    let consoleLogStub;

    beforeEach(() => {
      consoleLogStub = sinon.stub(aliyunRemove.serverless.cli, 'log').returns();
      listTriggersStub = sinon.stub(aliyunRemove.provider, 'listTriggers');
      deleteTriggerStub = sinon.stub(aliyunRemove.provider, 'deleteTrigger');

    });

    afterEach(() => {
      aliyunRemove.serverless.cli.log.restore();
      aliyunRemove.provider.listTriggers.restore();
      aliyunRemove.provider.deleteTrigger.restore();
    });

    it('should remove existing triggers', () => {
      aliyunRemove.triggers = [];
      aliyunRemove.fcService = fullService;
      aliyunRemove.fcFunctions = fullFunctions;

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

      return aliyunRemove.removeTriggersIfNeeded().then(() => {
        expect(listTriggersStub.callCount).toEqual(fullFunctions.length);
        fullFunctions.forEach((func, i) => {
          expect(listTriggersStub.getCall(i).args).toEqual([
            'my-service-dev', func.functionName
          ]);
        });

        expect(deleteTriggerStub.calledAfter(listTriggersStub)).toEqual(true);
        expect(deleteTriggerStub.calledOnce).toEqual(true);
        expect(deleteTriggerStub.getCall(0).args)
          .toEqual([
            'my-service-dev',
            'my-service-dev-ossTriggerTest', 'sls_oss_my_service_dev_ossTriggerTest'
          ]);

        const logs = [
          'Removing trigger sls_oss_my_service_dev_ossTriggerTest...',
          'Removed trigger sls_oss_my_service_dev_ossTriggerTest'
        ];
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
        }
      });
    });

    it('should not do anything if there are no existing triggers', () => {
      aliyunRemove.triggers = [];
      aliyunRemove.fcService = undefined;
      aliyunRemove.fcFunctions = [];

      listTriggersStub.returns(Promise.resolve([]));
      deleteTriggerStub.returns(Promise.resolve());

      return aliyunRemove.removeTriggersIfNeeded().then(() => {
        expect(listTriggersStub.called).toEqual(false);
        expect(deleteTriggerStub.called).toEqual(false);
        const logs = [
          'No triggers to remove.'
        ];
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
        }
      });
    });
  });
});
