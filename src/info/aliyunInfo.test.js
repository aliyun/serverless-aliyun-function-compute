/*global beforeEach, afterEach, expect*/

'use strict';

const sinon = require('sinon');

const AliyunProvider = require('../provider/aliyunProvider');
const AliyunInfo = require('./aliyunInfo');
const Serverless = require('../test/serverless');

describe('AliyunInfo', () => {
  let serverless;
  let options;
  let aliyunInfo;

  beforeEach(() => {
    serverless = new Serverless();
    options = {
      stage: 'my-stage',
      region: 'my-region',
    };
    serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
    serverless.pluginManager.setCliOptions(options);
    aliyunInfo = new AliyunInfo(serverless, options);
  });

  describe('#constructor()', () => {
    it('should set the serverless instance', () => {
      expect(aliyunInfo.serverless).toEqual(serverless);
    });

    it('should set options if provided', () => {
      expect(aliyunInfo.options).toEqual(options);
    });

    it('should make the provider accessible', () => {
      expect(aliyunInfo.provider).toBeInstanceOf(AliyunProvider);
    });

    describe('hooks', () => {
      let validateStub;
      let setDefaultsStub;
      let displayServiceInfoStub;

      beforeEach(() => {
        validateStub = sinon.stub(aliyunInfo, 'validate')
          .returns(Promise.resolve());
        setDefaultsStub = sinon.stub(aliyunInfo, 'setDefaults')
          .returns();
        displayServiceInfoStub = sinon.stub(aliyunInfo, 'displayServiceInfo')
          .returns(Promise.resolve());
      });

      afterEach(() => {
        aliyunInfo.validate.restore();
        aliyunInfo.setDefaults.restore();
        aliyunInfo.displayServiceInfo.restore();
      });

      it('should run "before:info:info" promise chain', () => aliyunInfo
        .hooks['before:info:info']().then(() => {
          expect(validateStub.calledOnce).toEqual(true);
          expect(setDefaultsStub.calledAfter(validateStub)).toEqual(true);
        }));

      // it('should run "deploy:deploy" promise chain', () => aliyunInfo
      //   .hooks['deploy:deploy']().then(() => {
      //     expect(displayServiceInfoStub.calledOnce).toEqual(true);
      //   }));

      it('should run "info:info" promise chain', () => aliyunInfo
        .hooks['info:info']().then(() => {
          expect(displayServiceInfoStub.calledOnce).toEqual(true);
        }));
    });
  });
});
