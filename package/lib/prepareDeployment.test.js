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
      "resources": {
        "sls-storage-bucket": {
          "type": "ALIYUN::OSS:Bucket",
          "name": "to-be-replaced-by-serverless"
        },
        "sls-storage-object": {
          "type": "ALIYUN::OSS:Object",
          "bucket": "to-be-replaced-by-serverless",
          "object": "to-be-replaced-by-serverless"
        },
        "sls-function-service": {
          "type": "ALIYUN::FC::Service",
          "name": "to-be-replaced-by-serverless"
        }
      }
    };
    serverless = new Serverless();
    serverless.service.service = 'my-service';
    serverless.service.provider = {
      compiledConfigurationTemplate: coreResources,
      deploymentBucketName: 'my-service'
    }
    serverless.setProvider('aliyun', new AliyunProvider(serverless));
    const options = {
      stage: 'dev',
      region: 'cn-shanghai',
    };
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
        resources: {
        "sls-storage-bucket": {
          "type": "ALIYUN::OSS:Bucket",
          "name": "my-service"
        },
        "sls-storage-object": {
          "type": "ALIYUN::OSS:Object",
          "bucket": "my-service",
          "object": "to-be-replaced-by-serverless"
        },
        "sls-function-service": {
          "type": "ALIYUN::FC::Service",
          "name": "to-be-replaced-by-serverless"
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
