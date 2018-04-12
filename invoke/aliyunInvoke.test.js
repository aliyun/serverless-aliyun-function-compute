/*global beforeEach, afterEach, expect*/

'use strict';

const sinon = require('sinon');
const BbPromise = require('bluebird');

const AliyunProvider = require('../provider/aliyunProvider');
const AliyunInvoke = require('./aliyunInvoke');
const Serverless = require('../test/serverless');

describe('AliyunInvoke', () => {
  let serverless;
  let options;
  let aliyunInvoke;

  beforeEach(() => {
    serverless = new Serverless();
    options = {
      stage: 'my-stage',
      region: 'my-region',
    };
    serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
    serverless.pluginManager.setCliOptions(options);
    aliyunInvoke = new AliyunInvoke(serverless, options);
  });

  describe('#constructor()', () => {
    it('should set the serverless instance', () => {
      expect(aliyunInvoke.serverless).toEqual(serverless);
    });

    it('should set options if provided', () => {
      expect(aliyunInvoke.options).toEqual(options);
    });

    it('should make the provider accessible', () => {
      expect(aliyunInvoke.provider).toBeInstanceOf(AliyunProvider);
    });

    describe('hooks', () => {
      let validateStub;
      let setDefaultsStub;
      let invokeFunctionStub;

      beforeEach(() => {
        validateStub = sinon.stub(aliyunInvoke, 'validate')
          .returns(BbPromise.resolve());
        setDefaultsStub = sinon.stub(aliyunInvoke, 'setDefaults')
          .returns(BbPromise.resolve());
        invokeFunctionStub = sinon.stub(aliyunInvoke, 'invokeFunction')
          .returns(BbPromise.resolve());
      });

      afterEach(() => {
        aliyunInvoke.validate.restore();
        aliyunInvoke.setDefaults.restore();
        aliyunInvoke.invokeFunction.restore();
      });

      it('should run "before:invoke:invoke" promise chain', () => aliyunInvoke
        .hooks['before:invoke:invoke']().then(() => {
          expect(validateStub.calledOnce).toEqual(true);
          expect(setDefaultsStub.calledAfter(validateStub)).toEqual(true);
        }));

      it('should run "invoke:invoke" promise chain', () => aliyunInvoke
        .hooks['invoke:invoke']().then(() => {
          expect(invokeFunctionStub.calledOnce).toEqual(true);
        }));
    });
  });
});
