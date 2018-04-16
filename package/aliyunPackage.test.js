/*global beforeEach, afterEach, expect*/

'use strict';

const sinon = require('sinon');
const path = require('path');
const _ = require('lodash');
const fs = require('fs');

const AliyunProvider = require('../provider/aliyunProvider');
const AliyunPackage = require('./aliyunPackage');
const Serverless = require('../test/serverless');
const { ramRoleStatements, functionDefs, directory } = require('../test/data');

describe('AliyunPackage', () => {
  let serverless;
  let options;
  let aliyunPackage;
  let consoleLogStub;
  const servicePath = path.join(__dirname, '..', 'test', 'project');
  beforeEach(() => {
    serverless = new Serverless();
    serverless.service.service = 'my-service';
    serverless.service.functions = _.cloneDeep(functionDefs);
    serverless.service.package = {
      artifact: '/tmp/my-service.zip'
    };
    serverless.config = {
      servicePath: servicePath
    };
    serverless.service.provider = {
      name: 'aliyun',
      credentials: path.join(__dirname, '..', 'test', 'credentials'),
      runtime: 'nodejs6',
      ramRoleStatements
    };
    options = {
      stage: 'dev',
      region: 'cn-shanghai',
    };
    serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
    serverless.pluginManager.setCliOptions(options);
    aliyunPackage = new AliyunPackage(serverless, options);
    consoleLogStub = sinon.stub(aliyunPackage.serverless.cli, 'log').returns();
    sinon.stub(aliyunPackage.provider, 'getArtifactDirectoryName').returns(directory);
  });

  afterEach(() => {
    aliyunPackage.serverless.cli.log.restore();
    aliyunPackage.provider.getArtifactDirectoryName.restore();
  });

  xdescribe('#constructor()', () => {
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
          .returns();
        validateStub = sinon.stub(aliyunPackage, 'validate')
          .returns(Promise.resolve());
        setDefaultsStub = sinon.stub(aliyunPackage, 'setDefaults')
          .returns();
        prepareDeploymentStub = sinon.stub(aliyunPackage, 'prepareDeployment')
          .returns();
        saveCreateTemplateFileStub = sinon.stub(aliyunPackage, 'saveCreateTemplateFile')
          .returns();
        compileFunctionsStub = sinon.stub(aliyunPackage, 'compileFunctions')
          .returns(Promise.resolve());
        mergeServiceResourcesStub = sinon.stub(aliyunPackage, 'mergeServiceResources')
          .returns();
        saveUpdateTemplateFileStub = sinon.stub(aliyunPackage, 'saveUpdateTemplateFile')
          .returns(Promise.resolve());
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

  describe('#package()', () => {
    beforeEach(() => {
      aliyunPackage.serverless.utils.writeFileSync = (filename, data) => {
        const dir = path.dirname(filename);
        if (!fs.existsSync(dir)) { fs.mkdirSync(dir); }
        fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf8');
      };
    });

    afterEach(() => {
      aliyunPackage.serverless.utils.writeFileSync = () => {};
    });

    it('should output proper templates', () => {
      const serverlessPath = path.join(servicePath, '.serverless');
      return aliyunPackage.hooks['package:cleanup']()
        .then(() => {
          expect(fs.existsSync(serverlessPath)).toBe(false);
        })
        .then(() => aliyunPackage.hooks['before:package:initialize']())
        .then(() => aliyunPackage.hooks['package:initialize']())
        .then(() => {
          expect(fs.existsSync(serverlessPath)).toBe(true);
        })
        .then(() => aliyunPackage.hooks['before:package:initialize']())
        .then(() => aliyunPackage.hooks['package:compileFunctions']())
        .then(() => aliyunPackage.hooks['package:finalize']())
        .then(() => {
          const files = fs.readdirSync(serverlessPath);
          const createName = 'configuration-template-create.json';
          const updateName = 'configuration-template-update.json';
          expect(files).toContain(createName);
          expect(files).toContain(updateName);

          const createTmpl = JSON.parse(
            fs.readFileSync(path.join(serverlessPath, createName), 'utf8')
          );
          const updateTmpl = JSON.parse(
            fs.readFileSync(path.join(serverlessPath, updateName), 'utf8')
          );

          const testSlsPath = path.join(__dirname, '..', 'test', '.serverless');
          const createExpected = JSON.parse(
            fs.readFileSync(path.join(testSlsPath, createName), 'utf8')
          );
          const updateExpected = JSON.parse(
            fs.readFileSync(path.join(testSlsPath, updateName), 'utf8')
          );

          updateExpected.Resources['sls-storage-object'].Properties.LocalPath = path.join(serverlessPath, 'my-service.zip');

          expect(createTmpl).toEqual(createExpected);
          expect(updateTmpl).toEqual(updateExpected);

          const logs = [
            'Compiling function "postTest"...',
            'Compiling function "getTest"...',
            'Compiling function "ossTriggerTest"...',
            'Finished Packaging.'
          ];
          for (var i = 0; i < consoleLogStub.callCount; ++i) {
            expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
          }
        });
    });
  });
});
