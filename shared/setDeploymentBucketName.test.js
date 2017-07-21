'use strict';

const BbPromise = require('bluebird');

const setDeploymentBucketName = require('./setDeploymentBucketName');
const AliyunProvider = require('../provider/aliyunProvider');
const Serverless = require('../test/serverless');
const AliyunCommand = require('../test/aliyunCommand');

describe('SetDeploymentBucketName', () => {
  let serverless;
  let aliyunCommand;
  let requestStub;

  beforeEach(() => {
    serverless = new Serverless();
    serverless.service = {
      service: 'my-service',
    };
    serverless.service.provider = {
      project: 'my-project',
    };
    const options = {
      stage: 'dev',
      region: 'cn-shanghai',
    };
    serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
    aliyunCommand = new AliyunCommand(serverless, options, setDeploymentBucketName);
  });

  afterEach(() => {
    
  });

  describe('#setDeploymentBucketName()', () => {
    it('should set the name of a deployment', () => {
      return aliyunCommand.setDeploymentBucketName().then(() => {
        expect(serverless.service.provider.deploymentBucketName)
          .toEqual('sls-my-service');
      });
    });
  });
});
