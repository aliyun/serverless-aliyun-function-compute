'use strict';

const sinon = require('sinon');
const path = require('path');
const BbPromise = require('bluebird');

const AliyunProvider = require('../../provider/aliyunProvider');
const AliyunRemove = require('../aliyunRemove');
const Serverless = require('../../test/serverless');
const { fullGroup, fullApis } = require('../../test/data');

const functionDefs = {
  postTest: {
    handler: 'index.postHandler',
    events: [
      { http: {
        path: '/baz',
        method: 'get'
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

const functions = [{
  functionName: 'my-service-dev-postTest',
  functionId: new Date().getTime().toString(16)
}, {
  functionName: 'my-service-dev-getTest',
  functionId: new Date().getTime().toString(16)
}];

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
    aliyunRemove = new AliyunRemove(serverless, options);
  });

  describe('#removeFunctionsAndService()', () => {
    let consoleLogStub;
    let getServiceStub;
    let getFunctionsStub;
    let deleteFunctionStub;
    let deleteServiceStub;

    beforeEach(() => {
      aliyunRemove.serverless.service.functions = {};
      consoleLogStub = sinon.stub(aliyunRemove.serverless.cli, 'log').returns();
      getServiceStub = sinon.stub(aliyunRemove.provider, 'getService');
      getFunctionsStub = sinon.stub(aliyunRemove.provider, 'getFunctions');
      deleteFunctionStub = sinon.stub(aliyunRemove.provider, 'deleteFunction');
      deleteServiceStub = sinon.stub(aliyunRemove.provider, 'deleteService');
    });

    afterEach(() => {
      aliyunRemove.serverless.cli.log.restore();
      aliyunRemove.provider.getService.restore();
      aliyunRemove.provider.getFunctions.restore();
      aliyunRemove.provider.deleteFunction.restore();
      aliyunRemove.provider.deleteService.restore();
    });

    it('should remove existing functions and service', () => {
      aliyunRemove.serverless.service.functions = functionDefs;
      const serviceId = new Date().getTime().toString(16);
      getServiceStub.returns(BbPromise.resolve({
        serviceId: serviceId,
        serviceName: 'my-service-dev'
      }));
      getFunctionsStub.returns(BbPromise.resolve(functions));
      deleteFunctionStub.returns(BbPromise.resolve());
      deleteServiceStub.returns(BbPromise.resolve());

      return aliyunRemove.removeFunctionsAndService().then(() => {
        expect(getServiceStub.calledOnce).toEqual(true);
        expect(getServiceStub.calledWithExactly('my-service-dev')).toEqual(true);

        expect(getFunctionsStub.calledAfter(getServiceStub)).toEqual(true);
        expect(getFunctionsStub.calledOnce).toEqual(true);
        expect(getFunctionsStub.calledWithExactly('my-service-dev')).toEqual(true);

        expect(deleteFunctionStub.calledAfter(getFunctionsStub)).toEqual(true);
        expect(deleteFunctionStub.calledTwice).toEqual(true);
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

        expect(deleteServiceStub.calledAfter(deleteFunctionStub)).toEqual(true);
        expect(deleteServiceStub.calledOnce).toEqual(true);
        expect(deleteServiceStub.calledWithExactly('my-service-dev')).toEqual(true);

        const logs = [
          'Removing functions...',
          'Removing function my-service-dev-postTest of service my-service-dev...',
          'Removed function my-service-dev-postTest of service my-service-dev',
          'Removing function my-service-dev-getTest of service my-service-dev...',
          'Removed function my-service-dev-getTest of service my-service-dev',
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
      const serviceId = new Date().getTime().toString(16);
      getServiceStub.returns(BbPromise.resolve({
        serviceId: serviceId,
        serviceName: 'my-service-dev'
      }));
      getFunctionsStub.returns(BbPromise.resolve([functions[0]]));
      deleteFunctionStub.returns(BbPromise.resolve());
      deleteServiceStub.returns(BbPromise.resolve());

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
      const serviceId = new Date().getTime().toString(16);
      getServiceStub.returns(BbPromise.resolve(undefined));
      getFunctionsStub.returns(BbPromise.resolve([]));
      deleteFunctionStub.returns(BbPromise.resolve());
      deleteServiceStub.returns(BbPromise.resolve());

      return aliyunRemove.removeFunctionsAndService().then(() => {
        expect(deleteFunctionStub.called).toEqual(false);
        expect(deleteServiceStub.called).toEqual(false);
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
