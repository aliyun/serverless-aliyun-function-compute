'use strict';

const fs = require('fs');
const path = require('path');

const sinon = require('sinon');
const BbPromise = require('bluebird');

const AliyunProvider = require('../../provider/aliyunProvider');
const AliyunDeploy = require('../aliyunDeploy');
const Serverless = require('../../test/serverless');

describe('setupFunctions', () => {
  let serverless;
  let aliyunDeploy;

  const functions = [{
    "name": "my-service-dev-currentTime",
    "service": "my-service-dev",
    "handler": "index.ping",
    "memorySize": 128,
    "timeout": 30,
    "runtime": "nodejs4.4",
    "code": {
      "ossBucketName": "sls-my-service",
      "ossObjectName": "serverless/my-service/dev/1499930388523-2017-07-13T07:19:48.523Z/my-service.zip"
    }
  }, {
    "name": "my-service-dev-currentTime2",
    "service": "my-service-dev",
    "handler": "index.ping",
    "memorySize": 128,
    "timeout": 30,
    "runtime": "nodejs4.4",
    "code": {
      "ossBucketName": "sls-my-service",
      "ossObjectName": "serverless/my-service/dev/1499930388523-2017-07-13T07:19:48.523Z/my-service.zip"
    }
  }];

  beforeEach(() => {
    serverless = new Serverless();
    serverless.service.service = 'my-service';
    serverless.service.provider = {
      name: 'aliyun',
      credentials: path.join(__dirname, '..', '..', 'test', 'credentials'),
    };
    serverless.config = {
      servicePath: path.join(__dirname, '..', '..', 'test')
    };
    const options = {
      stage: 'dev',
      region: 'cn-hangzhou',
    };
    serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
    aliyunDeploy = new AliyunDeploy(serverless, options);
  });

  describe('#setupFunctions()', () => {
    let checkExistingFunctionsStub;
    let createOrUpdateFunctionsStub;

    beforeEach(() => {
      checkExistingFunctionsStub = sinon.stub(aliyunDeploy, 'checkExistingFunctions')
        .returns(BbPromise.resolve());
      createOrUpdateFunctionsStub = sinon.stub(aliyunDeploy, 'createOrUpdateFunctions')
        .returns(BbPromise.resolve());
    });

    afterEach(() => {
      aliyunDeploy.checkExistingFunctions.restore();
      aliyunDeploy.createOrUpdateFunctions.restore();
    });

    it('should run promise chain and set up functions to create', () => aliyunDeploy
      .setupFunctions().then(() => {
        expect(checkExistingFunctionsStub.calledOnce).toEqual(true);
        expect(createOrUpdateFunctionsStub.calledAfter(checkExistingFunctionsStub));
        expect(aliyunDeploy.functions).toEqual(functions);
        expect(aliyunDeploy.functionMap).toBeInstanceOf(Map);
      }),
    );
  });

  describe('#setupFunctions()', () => {
    let getFunctionStub;
    let updateFunctionStub;
    let createFunctionStub;
    let consoleLogStub;

    beforeEach(() => {
      getFunctionStub = sinon.stub(aliyunDeploy.provider, 'getFunction');
      updateFunctionStub = sinon.stub(aliyunDeploy.provider, 'updateFunction');
      createFunctionStub = sinon.stub(aliyunDeploy.provider, 'createFunction');
      consoleLogStub = sinon.stub(aliyunDeploy.serverless.cli, 'log').returns();
    });

    afterEach(() => {      
      aliyunDeploy.provider.getFunction.restore();
      aliyunDeploy.provider.updateFunction.restore();
      aliyunDeploy.provider.createFunction.restore();
      aliyunDeploy.serverless.cli.log.restore();
    });

    it('should create and update functions according to the templates', () =>  {
        const err = new Error();
        err.code = 404;
        getFunctionStub
          .withArgs('my-service-dev', 'my-service-dev-currentTime')
          .returns(BbPromise.resolve());
        getFunctionStub
          .withArgs('my-service-dev', 'my-service-dev-currentTime2')
          .returns(BbPromise.reject(err));
        updateFunctionStub.returns(BbPromise.resolve());
        createFunctionStub.returns(BbPromise.resolve());
        return aliyunDeploy.setupFunctions().then(() => {
          expect(getFunctionStub.calledTwice).toEqual(true);
        });
      }
    );
  });

  describe('#checkExistingFunctions()', () => {
    let getFunctionStub;

    beforeEach(() => {
      // TODO(joyeecheung): mock to restore later
      aliyunDeploy.functions = functions;
      aliyunDeploy.functionMap = new Map();
      getFunctionStub = sinon.stub(aliyunDeploy.provider, 'getFunction');
    });

    afterEach(() => {
      aliyunDeploy.provider.getFunction.restore();
    });

    it('should fill in function map with existing functions', () =>  {
      const err = new Error();
      err.code = 404;
      const expectedMap = new Map([
        ['my-service-dev-currentTime', true],
        ['my-service-dev-currentTime2', false]
      ]);
        getFunctionStub
          .withArgs('my-service-dev', 'my-service-dev-currentTime')
          .returns(BbPromise.resolve());
        getFunctionStub
          .withArgs('my-service-dev', 'my-service-dev-currentTime2')
          .returns(BbPromise.reject(err));
        return aliyunDeploy.checkExistingFunctions().then(() => {
          expect(getFunctionStub.calledTwice).toEqual(true);
          expect(aliyunDeploy.functionMap).toEqual(expectedMap);
        });
      }
    );
  });

  describe('#createOrUpdateFunctions()', () => {
    let updateFunctionStub;
    let createFunctionStub;
    let consoleLogStub;

    beforeEach(() => {
      aliyunDeploy.functions = functions;
      aliyunDeploy.functionMap = new Map([
        ['my-service-dev-currentTime', true],
        ['my-service-dev-currentTime2', false]
      ]);
      updateFunctionStub = sinon.stub(aliyunDeploy.provider, 'updateFunction');
      createFunctionStub = sinon.stub(aliyunDeploy.provider, 'createFunction');
      consoleLogStub = sinon.stub(aliyunDeploy.serverless.cli, 'log').returns();
    });

    afterEach(() => {
      aliyunDeploy.provider.updateFunction.restore();
      aliyunDeploy.provider.createFunction.restore();
      aliyunDeploy.serverless.cli.log.restore();
    });

    it('should create and update functions according to the map', () => {
      updateFunctionStub.returns(BbPromise.resolve());
      createFunctionStub.returns(BbPromise.resolve());

      return aliyunDeploy.createOrUpdateFunctions().then(() => {
        expect(updateFunctionStub.calledOnce).toEqual(true);
        expect(updateFunctionStub.calledWithExactly(
          'my-service-dev',
          'my-service-dev-currentTime',
          functions[0]
        )).toEqual(true);
        expect(createFunctionStub.calledOnce).toEqual(true);
        expect(createFunctionStub.calledWithExactly(
          'my-service-dev',
          'my-service-dev-currentTime2',
          functions[1]
        )).toEqual(true);
        expect(consoleLogStub.calledTwice).toEqual(true);
        expect(createFunctionStub.calledAfter(updateFunctionStub)).toEqual(true);
      });
    });
  });
});