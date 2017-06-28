'use strict';

const path = require('path');

const sinon = require('sinon');

const AliyunProvider = require('../../provider/aliyunProvider');
const AliyunPackage = require('../aliyunPackage');
const Serverless = require('../../test/serverless');

describe('WriteFilesToDisk', () => {
  let serverless;
  let aliyunPackage;
  let writeFileSyncStub;

  beforeEach(() => {
    serverless = new Serverless();
    serverless.service.service = 'my-service';
    serverless.service.provider = {
      compiledConfigurationTemplate: {
        foo: 'bar',
      },
    };
    serverless.config = {
      servicePath: 'foo/my-service',
    };
    serverless.setProvider('aliyun', new AliyunProvider(serverless));
    const options = {
      stage: 'dev',
      region: 'cn-shanghai',
    };
    aliyunPackage = new AliyunPackage(serverless, options);
    writeFileSyncStub = sinon.stub(aliyunPackage.serverless.utils, 'writeFileSync');
  });

  afterEach(() => {
    aliyunPackage.serverless.utils.writeFileSync.restore();
  });

  describe('#saveCreateTemplateFile()', () => {
    it('should write the template file into the services .serverless directory', () => {
      const createFilePath = path.join(
        aliyunPackage.serverless.config.servicePath,
        '.serverless',
        'configuration-template-create.json',
      );

      return aliyunPackage.saveCreateTemplateFile().then(() => {
        expect(writeFileSyncStub.calledWithExactly(
          createFilePath,
          aliyunPackage.serverless.service.provider.compiledConfigurationTemplate,
        )).toEqual(true);
      });
    });
  });

  describe('#saveUpdateTemplateFile()', () => {
    it('should write the template file into the services .serverless directory', () => {
      const updateFilePath = path.join(
        aliyunPackage.serverless.config.servicePath,
        '.serverless',
        'configuration-template-update.json',
      );

      return aliyunPackage.saveUpdateTemplateFile().then(() => {
        expect(writeFileSyncStub.calledWithExactly(
          updateFilePath,
          aliyunPackage.serverless.service.provider.compiledConfigurationTemplate,
        )).toEqual(true);
      });
    });
  });
});
