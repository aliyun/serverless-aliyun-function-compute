'use strict';

const sinon = require('sinon');

const AliyunProvider = require('../../provider/aliyunProvider');
const AliyunPackage = require('../aliyunPackage');
const Serverless = require('../../test/serverless');

describe('PrepareDeployment', () => {
  let coreResources;
  let serverless;
  let aliyunPackage;

  beforeEach(() => {
    coreResources = {
      "Resources": {
        "sls-storage-bucket": {
          "Type": "ALIYUN::OSS:Bucket",
          "Properties": {
            "BucketName": "to-be-replaced-by-serverless",
            "Region": "to-be-replaced-by-serverless"
          }
        },
        "sls-function-service": {
          "Type": "ALIYUN::FC::Service",
          "Properties": {
            "name": "to-be-replaced-by-serverless",
            "region": "to-be-replaced-by-serverless"
          }
        }
      }
    };
    serverless = new Serverless();
    serverless.service.service = 'my-service';
    serverless.service.provider = {
      compiledConfigurationTemplate: coreResources,
      deploymentBucketName: 'my-service'
    }
    const options = {
      stage: 'dev',
      region: 'cn-shanghai',
    };
    serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
    aliyunPackage = new AliyunPackage(serverless, options);
  });

  describe('#prepareDeployment()', () => {
    let readFileSyncStub;

    beforeEach(() => {
      readFileSyncStub = sinon.stub(serverless.utils, 'readFileSync').returns(coreResources);
    });

    afterEach(() => {
      serverless.utils.readFileSync.restore();
    });

    it('should load the core configuration template into the serverless instance', () => {
      const expectedCompiledConfiguration = {
        "Resources": {
          "sls-storage-bucket": {
            "Type": "ALIYUN::OSS:Bucket",
            "Properties": {
              "BucketName": "my-service",
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
        expect(readFileSyncStub.calledOnce).toEqual(true);
        expect(serverless.service.provider
          .compiledConfigurationTemplate).toEqual(expectedCompiledConfiguration);
      });
    });
  });
});
