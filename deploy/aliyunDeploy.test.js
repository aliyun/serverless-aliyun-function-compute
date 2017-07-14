'use strict';

const sinon = require('sinon');
const BbPromise = require('bluebird');
const path = require('path');
const fs = require('fs');

const AliyunProvider = require('../provider/aliyunProvider');
const AliyunDeploy = require('./aliyunDeploy');
const Serverless = require('../test/serverless');

describe('AliyunDeploy', () => {
  let serverless;
  let options;
  let aliyunDeploy;
  const servicePath = path.join(__dirname, '..', 'test');
  beforeEach(() => {
    serverless = new Serverless();
    serverless.config = {
      servicePath: servicePath
    };
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

    it('should make the templates accessible', () => {
      const create = fs.readFileSync(
            path.join(servicePath, '.serverless', 'configuration-template-create.json'), 'utf8');
      const update = fs.readFileSync(
            path.join(servicePath, '.serverless', 'configuration-template-update.json'), 'utf8');
      const templates = {
        create: JSON.parse(create),
        update: JSON.parse(update)
      }
      expect(aliyunDeploy.templates).toEqual(templates);
    });

    describe('hooks', () => {
      let validateStub;
      let setDefaultsStub;
      let setupServiceStub;
      let uploadArtifactsStub;
      let setupFunctionsStub;
      let setupTriggersStub;

      beforeEach(() => {
        validateStub = sinon.stub(aliyunDeploy, 'validate')
          .returns(BbPromise.resolve());
        setDefaultsStub = sinon.stub(aliyunDeploy, 'setDefaults')
          .returns(BbPromise.resolve());
        setupServiceStub = sinon.stub(aliyunDeploy, 'setupService')
          .returns(BbPromise.resolve());
        uploadArtifactsStub = sinon.stub(aliyunDeploy, 'uploadArtifacts')
          .returns(BbPromise.resolve());
        setupFunctionsStub = sinon.stub(aliyunDeploy, 'setupFunctions')
          .returns(BbPromise.resolve());
        setupTriggersStub = sinon.stub(aliyunDeploy, 'setupTriggers')
          .returns(BbPromise.resolve());
      });

      afterEach(() => {
        aliyunDeploy.validate.restore();
        aliyunDeploy.setDefaults.restore();
        aliyunDeploy.setupService.restore();
        aliyunDeploy.uploadArtifacts.restore();
        aliyunDeploy.setupFunctions.restore();
        aliyunDeploy.setupTriggers.restore();
      });

      it('should run "before:deploy:deploy" promise chain', () => aliyunDeploy
        .hooks['before:deploy:deploy']().then(() => {
          expect(validateStub.calledOnce).toEqual(true);
          expect(setDefaultsStub.calledAfter(validateStub)).toEqual(true);
        }));

      it('should run "deploy:deploy" promise chain', () => aliyunDeploy
        .hooks['deploy:deploy']().then(() => {
          expect(setupServiceStub.calledOnce).toEqual(true);
          expect(uploadArtifactsStub.calledAfter(setupServiceStub)).toEqual(true);
          expect(setupFunctionsStub.calledAfter(uploadArtifactsStub)).toEqual(true);
          expect(setupTriggersStub.calledAfter(setupFunctionsStub)).toEqual(true);
        }));
    });
  });
});
