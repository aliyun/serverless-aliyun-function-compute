'use strict';

const AliyunProvider = require('../../provider/aliyunProvider');
const AliyunPackage = require('../aliyunPackage');
const Serverless = require('../../test/serverless');

describe('GenerateArtifactDirectoryName', () => {
  let serverless;
  let aliyunPackage;

  beforeEach(() => {
    serverless = new Serverless();
    serverless.service.service = 'my-service';
    serverless.service.package = {
      artifactDirectoryName: null,
    };
    serverless.setProvider('aliyun', new AliyunProvider(serverless));
    const options = {
      stage: 'dev',
      region: 'cn-shanghai',
    };
    aliyunPackage = new AliyunPackage(serverless, options);
  });

  it('should create a valid artifact directory name', () => {
    const expectedRegex = new RegExp('serverless/my-service/dev/.*');

    return aliyunPackage.generateArtifactDirectoryName().then(() => {
      expect(serverless.service.package.artifactDirectoryName)
        .toMatch(expectedRegex);
    });
  });
});
