/*global beforeEach, afterEach, expect*/

'use strict';

const sinon = require('sinon');
const path = require('path');

const AliyunProvider = require('../../provider/aliyunProvider');
const AliyunRemove = require('../aliyunRemove');
const Serverless = require('../../test/serverless');
const { functionDefs, fullFunctions, fullService } = require('../../test/data');

describe('removeFunctionsAndService', () => {
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

  describe('#removeFunctionsAndService()', () => {
    let consoleLogStub;
    let deleteFunctionStub;
    let deleteServiceStub;
    let removeRoleAndPoliciesStub;

    beforeEach(() => {
      aliyunRemove.serverless.service.functions = {};
      consoleLogStub = sinon.stub(aliyunRemove.serverless.cli, 'log').returns();
      deleteFunctionStub = sinon.stub(aliyunRemove.provider, 'deleteFunction');
      deleteServiceStub = sinon.stub(aliyunRemove.provider, 'deleteService');
      removeRoleAndPoliciesStub = sinon.stub(aliyunRemove, 'removeRoleAndPolicies').returns(Promise.resolve());
      aliyunRemove.fcService = undefined;
      aliyunRemove.fcFunctions = [];
    });

    afterEach(() => {
      aliyunRemove.serverless.cli.log.restore();
      aliyunRemove.provider.deleteFunction.restore();
      aliyunRemove.provider.deleteService.restore();
      aliyunRemove.removeRoleAndPolicies.restore();
    });

    it('should remove existing functions and service', () => {
      aliyunRemove.serverless.service.functions = functionDefs;
      aliyunRemove.fcService = fullService;
      aliyunRemove.fcFunctions = fullFunctions;
      deleteFunctionStub.returns(Promise.resolve());
      deleteServiceStub.returns(Promise.resolve());

      return aliyunRemove.removeFunctionsAndService().then(() => {
        expect(deleteFunctionStub.callCount).toEqual(3);
        expect(deleteFunctionStub.getCall(0).args)
          .toEqual([
            'my-service-dev',
            'my-service-dev-postTest'
          ]);
        expect(deleteFunctionStub.getCall(1).args)
          .toEqual([
            'my-service-dev',
            'my-service-dev-getTest'
          ]);
        expect(deleteFunctionStub.getCall(2).args)
          .toEqual([
            'my-service-dev',
            'my-service-dev-ossTriggerTest'
          ]);

        expect(deleteServiceStub.calledAfter(deleteFunctionStub)).toEqual(true);
        expect(deleteServiceStub.calledOnce).toEqual(true);
        expect(deleteServiceStub.calledWithExactly('my-service-dev')).toEqual(true);

        expect(removeRoleAndPoliciesStub.calledAfter(deleteServiceStub)).toEqual(true);
        expect(removeRoleAndPoliciesStub.calledWithExactly('sls-my-service-dev-exec-role')).toEqual(true);

        const logs = [
          'Removing functions...',
          'Removing function my-service-dev-postTest of service my-service-dev...',
          'Removed function my-service-dev-postTest of service my-service-dev',
          'Removing function my-service-dev-getTest of service my-service-dev...',
          'Removed function my-service-dev-getTest of service my-service-dev',
          'Removing function my-service-dev-ossTriggerTest of service my-service-dev...',
          'Removed function my-service-dev-ossTriggerTest of service my-service-dev',
          'Removing service my-service-dev...',
          'Removed service my-service-dev'
        ];
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
        }
      });
    });

    it('should only remove existing functions', () => {
      aliyunRemove.serverless.service.functions = functionDefs;
      aliyunRemove.fcService = fullService;
      aliyunRemove.fcFunctions = [fullFunctions[0]];
      deleteFunctionStub.returns(Promise.resolve());
      deleteServiceStub.returns(Promise.resolve());

      return aliyunRemove.removeFunctionsAndService().then(() => {
        expect(deleteFunctionStub.calledOnce).toEqual(true);
        expect(deleteFunctionStub.getCall(0).args)
          .toEqual([
            'my-service-dev',
            'my-service-dev-postTest'
          ]);

        expect(deleteServiceStub.calledAfter(deleteFunctionStub)).toEqual(true);
        expect(deleteServiceStub.calledOnce).toEqual(true);
        expect(deleteServiceStub.calledWithExactly('my-service-dev')).toEqual(true);

        expect(removeRoleAndPoliciesStub.calledAfter(deleteServiceStub)).toEqual(true);
        expect(removeRoleAndPoliciesStub.calledWithExactly('sls-my-service-dev-exec-role')).toEqual(true);

        const logs = [
          'Removing functions...',
          'Removing function my-service-dev-postTest of service my-service-dev...',
          'Removed function my-service-dev-postTest of service my-service-dev',
          'Removing service my-service-dev...',
          'Removed service my-service-dev'
        ];
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
        }
      });
    });

    it('should not remove service if it does not exist', () => {
      aliyunRemove.serverless.service.functions = functionDefs;
      aliyunRemove.fcService = undefined;
      aliyunRemove.fcFunctions = [];
      deleteFunctionStub.returns(Promise.resolve());
      deleteServiceStub.returns(Promise.resolve());

      return aliyunRemove.removeFunctionsAndService().then(() => {
        expect(deleteFunctionStub.called).toEqual(false);
        expect(deleteServiceStub.called).toEqual(false);
        expect(removeRoleAndPoliciesStub.calledOnce).toEqual(true);
        expect(removeRoleAndPoliciesStub.calledWithExactly('sls-my-service-dev-exec-role')).toEqual(true);

        const logs = [
          'Removing functions...',
          'No functions to remove.',
          'No services to remove.'
        ];
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
        }
      });
    });
  });
});
