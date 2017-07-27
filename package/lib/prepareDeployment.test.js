'use strict';

const sinon = require('sinon');

const AliyunProvider = require('../../provider/aliyunProvider');
const AliyunPackage = require('../aliyunPackage');
const Serverless = require('../../test/serverless');

describe('PrepareDeployment', () => {
  let serverless;
  let aliyunPackage;

  beforeEach(() => {
    serverless = new Serverless();
    serverless.service.service = 'my-service';
    serverless.service.provider = {};
    const options = {
      stage: 'dev',
      region: 'cn-shanghai',
    };
    serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
    aliyunPackage = new AliyunPackage(serverless, options);
  });

  describe('#prepareDeployment()', () => {
    it('should load the core configuration template into the serverless instance', () => {
      const expectedCompiledConfiguration = {
        "Resources": {
          "sls-storage-bucket": {
            "Type": "ALIYUN::OSS:Bucket",
            "Properties": {
              "BucketName": "sls-my-service",
              "Region": "cn-shanghai"
            }
          },
          "sls-function-service": {
            "Type": "ALIYUN::FC::Service",
            "Properties": {
              "name": "my-service-dev",
              "region": "cn-shanghai"
            }
          }
        }
      };

      return aliyunPackage.prepareDeployment().then(() => {
        expect(serverless.service.provider
          .compiledConfigurationTemplate).toEqual(expectedCompiledConfiguration);
      });
    });
  });
});
