'use strict';

const sinon = require('sinon');
const BbPromise = require('bluebird');

const AliyunProvider = require('../provider/aliyunProvider');
const AliyunRemove = require('./aliyunRemove');
const Serverless = require('../test/serverless');

describe('AliyunRemove', () => {
  let serverless;
  let options;
  let aliyunRemove;

  beforeEach(() => {
    serverless = new Serverless();
    options = {
      stage: 'my-stage',
      region: 'my-region',
    };
    serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
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
      let setDeploymentBucketNameStub;
      let removeEventsStub;
      let removeFunctionsAndServiceStub;
      let removeArtifactsStub;

      beforeEach(() => {
        validateStub = sinon.stub(aliyunRemove, 'validate')
          .returns(BbPromise.resolve());
        setDefaultsStub = sinon.stub(aliyunRemove, 'setDefaults')
          .returns(BbPromise.resolve());
        setDeploymentBucketNameStub = sinon.stub(aliyunRemove, 'setDeploymentBucketName')
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
        aliyunRemove.setDeploymentBucketName.restore();
        aliyunRemove.removeEvents.restore();
        aliyunRemove.removeFunctionsAndService.restore();
        aliyunRemove.removeArtifacts.restore();
      });

      it('should run "before:remove:remove" promise chain', () => aliyunRemove
        .hooks['before:remove:remove']().then(() => {
          expect(validateStub.calledOnce).toEqual(true);
          expect(setDefaultsStub.calledAfter(validateStub)).toEqual(true);
          expect(setDeploymentBucketNameStub.calledAfter(setDefaultsStub)).toEqual(true);
        }));

      it('should run "remove:remove" promise chain', () => aliyunRemove
        .hooks['remove:remove']().then(() => {
          expect(removeEventsStub.calledOnce).toEqual(true);
          expect(removeFunctionsAndServiceStub.calledAfter(removeEventsStub)).toEqual(true);
          expect(removeArtifactsStub.calledAfter(removeFunctionsAndServiceStub)).toEqual(true);
        }));
    });
  });
});
