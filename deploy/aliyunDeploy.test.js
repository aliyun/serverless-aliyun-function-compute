'use strict';

const sinon = require('sinon');
const BbPromise = require('bluebird');

const AliyunProvider = require('../provider/aliyunProvider');
const AliyunDeploy = require('./aliyunDeploy');
const Serverless = require('../test/serverless');

describe('AliyunDeploy', () => {
  let serverless;
  let options;
  let aliyunDeploy;

  beforeEach(() => {
    serverless = new Serverless();
    options = {
      stage: 'my-stage',
      region: 'my-region',
    };
    serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
    aliyunDeploy = new AliyunDeploy(serverless, options);
  });

  describe('#constructor()', () => {
    it('should set the serverless instance', () => {
      expect(aliyunDeploy.serverless).toEqual(serverless);
    });

    it('should set options if provided', () => {
      expect(aliyunDeploy.options).toEqual(options);
    });

    it('should make the provider accessible', () => {
      expect(aliyunDeploy.provider).toBeInstanceOf(AliyunProvider);
    });

    describe('hooks', () => {
      let validateStub;
      let setDefaultsStub;
      let createOrUpdateServiceStub;
      let setDeploymentBucketNameStub;
      let uploadArtifactsStub;
      let createOrUpdateFunctionsStub;

      beforeEach(() => {
        validateStub = sinon.stub(aliyunDeploy, 'validate')
          .returns(BbPromise.resolve());
        setDefaultsStub = sinon.stub(aliyunDeploy, 'setDefaults')
          .returns(BbPromise.resolve());
        createOrUpdateServiceStub = sinon.stub(aliyunDeploy, 'createOrUpdateService')
          .returns(BbPromise.resolve());
        setDeploymentBucketNameStub = sinon.stub(aliyunDeploy, 'setDeploymentBucketName')
          .returns(BbPromise.resolve());
        uploadArtifactsStub = sinon.stub(aliyunDeploy, 'uploadArtifacts')
          .returns(BbPromise.resolve());
        createOrUpdateFunctionsStub = sinon.stub(aliyunDeploy, 'createOrUpdateFunctions')
          .returns(BbPromise.resolve());
      });

      afterEach(() => {
        aliyunDeploy.validate.restore();
        aliyunDeploy.setDefaults.restore();
        aliyunDeploy.createOrUpdateService.restore();
        aliyunDeploy.setDeploymentBucketName.restore();
        aliyunDeploy.uploadArtifacts.restore();
        aliyunDeploy.createOrUpdateFunctions.restore();
      });

      it('should run "before:deploy:deploy" promise chain', () => aliyunDeploy
        .hooks['before:deploy:deploy']().then(() => {
          expect(validateStub.calledOnce).toEqual(true);
          expect(setDefaultsStub.calledAfter(validateStub)).toEqual(true);
        }));

      it('should run "deploy:deploy" promise chain', () => aliyunDeploy
        .hooks['deploy:deploy']().then(() => {
          expect(createOrUpdateServiceStub.calledOnce).toEqual(true);
          expect(setDeploymentBucketNameStub.calledAfter(createOrUpdateServiceStub)).toEqual(true);
          expect(uploadArtifactsStub.calledAfter(createOrUpdateServiceStub)).toEqual(true);
          expect(createOrUpdateFunctionsStub.calledAfter(uploadArtifactsStub)).toEqual(true);
        }));
    });
  });
});
