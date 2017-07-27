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
    "name": "my-service-dev-postTest",
    "service": "my-service-dev",
    "handler": "index.postHandler",
    "memorySize": 128,
    "timeout": 30,
    "runtime": "nodejs4.4",
    "code": {
      "ossBucketName": "sls-my-service",
      "ossObjectName": "serverless/my-service/dev/1500622721413-2017-07-21T07:38:41.413Z/my-service.zip"
    }
  }, {
    "name": "my-service-dev-getTest",
    "service": "my-service-dev",
    "handler": "index.getHandler",
    "memorySize": 128,
    "timeout": 30,
    "runtime": "nodejs4.4",
    "code": {
      "ossBucketName": "sls-my-service",
      "ossObjectName": "serverless/my-service/dev/1500622721413-2017-07-21T07:38:41.413Z/my-service.zip"
    }
  }];

  beforeEach(() => {
    serverless = new Serverless();
    serverless.service.service = 'my-service';
    serverless.service.provider = {
      name: 'aliyun',
      credentials: path.join(__dirname, '..', '..', 'test', 'credentials'),
    };
    const options = {
      stage: 'dev',
      region: 'cn-shanghai',
    };
    serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
    aliyunDeploy = new AliyunDeploy(serverless, options);
    aliyunDeploy.templates = {
      create: require(path.join(__dirname, '..', '..', 'test', '.serverless', 'configuration-template-create.json')),
      update: require(path.join(__dirname, '..', '..', 'test', '.serverless', 'configuration-template-update.json')),
    }
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
        getFunctionStub
          .withArgs('my-service-dev', 'my-service-dev-postTest')
          .returns(BbPromise.resolve(functions[0]));
        getFunctionStub
          .withArgs('my-service-dev', 'my-service-dev-getTest')
          .returns(BbPromise.resolve(undefined));
        updateFunctionStub.returns(BbPromise.resolve());
        createFunctionStub.returns(BbPromise.resolve());
        return aliyunDeploy.setupFunctions().then(() => {
          expect(getFunctionStub.calledTwice).toEqual(true);
          expect(getFunctionStub.calledWithExactly('my-service-dev', 'my-service-dev-postTest')).toEqual(true);
          expect(getFunctionStub.calledWithExactly('my-service-dev', 'my-service-dev-getTest')).toEqual(true);

          expect(updateFunctionStub.calledAfter(getFunctionStub)).toEqual(true);
          expect(updateFunctionStub.calledOnce).toEqual(true);
          expect(updateFunctionStub.calledWithExactly(
            'my-service-dev',
            'my-service-dev-postTest',
            functions[0]
          )).toEqual(true);

          expect(createFunctionStub.calledAfter(updateFunctionStub)).toEqual(true);
          expect(createFunctionStub.calledOnce).toEqual(true);
          expect(createFunctionStub.calledWithExactly(
            'my-service-dev',
            'my-service-dev-getTest',
            functions[1]
          )).toEqual(true);

          const logs = [
            'Updating function my-service-dev-postTest...',
            'Updated function my-service-dev-postTest',
            'Creating function my-service-dev-getTest...',
            'Created function my-service-dev-getTest'
          ];
          expect(consoleLogStub.callCount).toEqual(logs.length);
          for (var i = 0; i < consoleLogStub.callCount; ++i) {
            expect(consoleLogStub.calledWithExactly(logs[i])).toEqual(true);
          }
        });
      }
    );
  });
});
