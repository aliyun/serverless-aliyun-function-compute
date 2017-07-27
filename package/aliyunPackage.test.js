'use strict';

const sinon = require('sinon');
const BbPromise = require('bluebird');

const AliyunProvider = require('../provider/aliyunProvider');
const AliyunPackage = require('./aliyunPackage');
const Serverless = require('../test/serverless');

describe('AliyunPackage', () => {
  let serverless;
  let options;
  let aliyunPackage;

  beforeEach(() => {
    serverless = new Serverless();
    options = {
      stage: 'my-stage',
      region: 'my-region',
    };
    serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
    aliyunPackage = new AliyunPackage(serverless, options);
  });

  describe('#constructor()', () => {
    it('should set the serverless instance', () => {
      expect(aliyunPackage.serverless).toEqual(serverless);
    });

    it('should set options if provided', () => {
      expect(aliyunPackage.options).toEqual(options);
    });

    it('should make the provider accessible', () => {
      expect(aliyunPackage.provider).toBeInstanceOf(AliyunProvider);
    });

    describe('hooks', () => {
      let cleanupServerlessDirStub;
      let validateStub;
      let setDefaultsStub;
      let prepareDeploymentStub;
      let saveCreateTemplateFileStub;
      let compileFunctionsStub;
      let mergeServiceResourcesStub;
      let saveUpdateTemplateFileStub;

      beforeEach(() => {
        cleanupServerlessDirStub = sinon.stub(aliyunPackage, 'cleanupServerlessDir')
          .returns(BbPromise.resolve());
        validateStub = sinon.stub(aliyunPackage, 'validate')
          .returns(BbPromise.resolve());
        setDefaultsStub = sinon.stub(aliyunPackage, 'setDefaults')
          .returns(BbPromise.resolve());
        prepareDeploymentStub = sinon.stub(aliyunPackage, 'prepareDeployment')
          .returns(BbPromise.resolve());
        saveCreateTemplateFileStub = sinon.stub(aliyunPackage, 'saveCreateTemplateFile')
          .returns(BbPromise.resolve());
        compileFunctionsStub = sinon.stub(aliyunPackage, 'compileFunctions')
          .returns(BbPromise.resolve());
        mergeServiceResourcesStub = sinon.stub(aliyunPackage, 'mergeServiceResources')
          .returns(BbPromise.resolve());
        saveUpdateTemplateFileStub = sinon.stub(aliyunPackage, 'saveUpdateTemplateFile')
          .returns(BbPromise.resolve());
      });

      afterEach(() => {
        aliyunPackage.cleanupServerlessDir.restore();
        aliyunPackage.validate.restore();
        aliyunPackage.setDefaults.restore();
        aliyunPackage.prepareDeployment.restore();
        aliyunPackage.saveCreateTemplateFile.restore();
        aliyunPackage.compileFunctions.restore();
        aliyunPackage.mergeServiceResources.restore();
        aliyunPackage.saveUpdateTemplateFile.restore();
      });

      it('should run "package:cleanup" promise chain', () => aliyunPackage
        .hooks['package:cleanup']().then(() => {
          expect(cleanupServerlessDirStub.calledOnce).toEqual(true);
        }));

      it('should run "before:package:initialize" promise chain', () => aliyunPackage
        .hooks['before:package:initialize']().then(() => {
          expect(validateStub.calledOnce).toEqual(true);
          expect(setDefaultsStub.calledAfter(validateStub)).toEqual(true);
        }));

      it('should run "package:initialize" promise chain', () => aliyunPackage
        .hooks['package:initialize']().then(() => {
          expect(prepareDeploymentStub.calledOnce).toEqual(true);
          expect(saveCreateTemplateFileStub.calledAfter(prepareDeploymentStub)).toEqual(true);
        }));

      it('should run "package:compileFunctions" promise chain', () => aliyunPackage
        .hooks['package:compileFunctions']().then(() => {
          expect(compileFunctionsStub.calledOnce).toEqual(true);
        }));

      it('should run "package:finalize" promise chain', () => aliyunPackage
        .hooks['package:finalize']().then(() => {
          expect(mergeServiceResourcesStub.calledOnce).toEqual(true);
          expect(saveUpdateTemplateFileStub.calledAfter(mergeServiceResourcesStub)).toEqual(true);
        }));
    });
  });
});
