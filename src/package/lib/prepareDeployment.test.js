/*global beforeEach, expect*/

'use strict';

const path = require('path');

const AliyunProvider = require('../../provider/aliyunProvider');
const AliyunPackage = require('../aliyunPackage');
const Serverless = require('../../test/serverless');
const { ramRoleStatements } = require('../../test/data');

describe('PrepareDeployment', () => {
  let serverless;
  let aliyunPackage;

  beforeEach(() => {
    serverless = new Serverless();
    serverless.service.service = 'my-service';
    serverless.service.provider = {
      credentials: path.join(__dirname, '..', '..', 'test', 'credentials'),
      ramRoleStatements: ramRoleStatements
    };
    const options = {
      stage: 'dev',
      region: 'cn-shanghai',
    };
    serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
    aliyunPackage = new AliyunPackage(serverless, options);
  });

  describe('#prepareDeployment()', () => {
    it('should load the core configuration template into the serverless instance', () => {
      const expectedCompiledConfiguration = require(
        path.join(__dirname, '..', '..', 'test', '.serverless','configuration-template-create.json'));

      aliyunPackage.prepareDeployment();
      expect(serverless.service.provider.compiledConfigurationTemplate)
        .toEqual(expectedCompiledConfiguration);
    });
  });
});
