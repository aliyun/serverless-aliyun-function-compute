/*global beforeEach, afterEach, expect*/

'use strict';

const sinon = require('sinon');
const path = require('path');
const BbPromise = require('bluebird');

const AliyunProvider = require('../../provider/aliyunProvider');
const AliyunRemove = require('../aliyunRemove');
const Serverless = require('../../test/serverless');
const { fullGroup, fullApis, functionDefs, fullFunctions, fullService } = require('../../test/data');

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
    let getServiceStub;
    let getFunctionsStub;

    beforeEach(() => {
      aliyunRemove.serverless.service.functions = {};
      consoleLogStub = sinon.stub(aliyunRemove.serverless.cli, 'log').returns();
      getServiceStub = sinon.stub(aliyunRemove.provider, 'getService');
      getFunctionsStub = sinon.stub(aliyunRemove.provider, 'getFunctions');
    });

    afterEach(() => {
      aliyunRemove.serverless.cli.log.restore();
      aliyunRemove.provider.getService.restore();
      aliyunRemove.provider.getFunctions.restore();
    });

    it('should get existing functions and service', () => {
      aliyunRemove.serverless.service.functions = functionDefs;
      getServiceStub.returns(BbPromise.resolve(fullService));
      getFunctionsStub.returns(BbPromise.resolve(fullFunctions));

      return aliyunRemove.getFunctionsAndService().then(() => {
        expect(getServiceStub.calledOnce).toEqual(true);
        expect(getServiceStub.calledWithExactly('my-service-dev')).toEqual(true);

        expect(getFunctionsStub.calledAfter(getServiceStub)).toEqual(true);
        expect(getFunctionsStub.calledOnce).toEqual(true);
        expect(getFunctionsStub.calledWithExactly('my-service-dev')).toEqual(true);

        expect(aliyunRemove.fcService).toEqual(fullService);
        expect(aliyunRemove.fcFunctions).toEqual(fullFunctions);
      });
    });

    it('should handle non-existing service', () => {
      aliyunRemove.serverless.service.functions = functionDefs;
      getServiceStub.returns(BbPromise.resolve(undefined));
      getFunctionsStub.returns(BbPromise.resolve([]));

      return aliyunRemove.getFunctionsAndService().then(() => {
        expect(getServiceStub.calledOnce).toEqual(true);
        expect(getServiceStub.calledWithExactly('my-service-dev')).toEqual(true);

        expect(getFunctionsStub.called).toEqual(false);
        expect(aliyunRemove.fcService).toEqual(undefined);
        expect(aliyunRemove.fcFunctions).toEqual([]);
      });
    });
  });
});
