'use strict';

const sinon = require('sinon');

const AliyunProvider = require('../../provider/aliyunProvider');
const AliyunPackage = require('../aliyunPackage');
const Serverless = require('../../test/serverless');

describe('CompileFunctions', () => {
  let serverless;
  let aliyunPackage;
  let consoleLogStub;

  beforeEach(() => {
    serverless = new Serverless();
    serverless.service.service = 'my-service';
    serverless.service.package = {
      artifact: 'artifact.zip',
      artifactDirectoryName: 'serverless/my-service/dev/1498638463280',
    };
    serverless.service.stage = 'dev';
    serverless.service.provider = {
      compiledConfigurationTemplate: {
        resources: {
          "sls-storage-object": {
            "type": "ALIYUN::OSS:Object",
            "bucket": "my-service",
            "object": ""
          }
        }
      },
      deploymentBucketName: 'my-service'
    }
    serverless.setProvider('aliyun', new AliyunProvider(serverless));
    const options = {
      stage: 'dev',
      region: 'cn-hangzhou',
    };
    aliyunPackage = new AliyunPackage(serverless, options);
    consoleLogStub = sinon.stub(aliyunPackage.serverless.cli, 'log').returns();
  });

  afterEach(() => {
    aliyunPackage.serverless.cli.log.restore();
    aliyunPackage.serverless.service.functions = {};
    aliyunPackage.serverless.service.provider.memorySize = undefined;
    aliyunPackage.serverless.service.provider.timeout = undefined;
  });

  describe('#compileFunctions()', () => {
    it('should throw an error if the function has no handler property', () => {
      aliyunPackage.serverless.service.functions = {
        func1: {
          handler: null,
        },
      };

      expect(() => aliyunPackage.compileFunctions()).toThrow(Error);
    });

    it('should throw an error if the function has no events property', () => {
      aliyunPackage.serverless.service.functions = {
        func1: {
          handler: 'func1',
          events: null,
        },
      };

      expect(() => aliyunPackage.compileFunctions()).toThrow(Error);
    });

    it('should throw an error if the function has 0 events', () => {
      aliyunPackage.serverless.service.functions = {
        func1: {
          handler: 'func1',
          events: [],
        },
      };

      expect(() => aliyunPackage.compileFunctions()).toThrow(Error);
    });

    it('should throw an error if the function has more than 1 event', () => {
      aliyunPackage.serverless.service.functions = {
        func1: {
          handler: 'func1',
          events: [
            { http: 'event1' },
            { http: 'event2' },
          ],
        },
      };

      expect(() => aliyunPackage.compileFunctions()).toThrow(Error);
    });

    it('should throw an error if the functions event is not supported', () => {
      aliyunPackage.serverless.service.functions = {
        func1: {
          handler: 'func1',
          events: [
            { invalidEvent: 'event1' },
          ],
        },
      };

      expect(() => aliyunPackage.compileFunctions()).toThrow(Error);
    });

    it('should set the memory size based on the functions configuration', () => {
      aliyunPackage.serverless.service.functions = {
        func1: {
          handler: 'index.func1',
          memorySize: 1024,
          events: [
            { http: {
              path: '/test',
              method: 'get'
            } },
          ],
        }
      };

      const compiledResources = {
        "sls-my-service-dev-func1": {
          "type": "ALIYUN::FC::Function",
          "name": "my-service-dev-func1",
          "service": "my-service-dev",
          "handler": "index.func1",
          "memorySize": 1024,
          "timeout": 30,
          "runtime": "nodejs4.4",
          "code": {
            "ossBucketName": "my-service",
            "ossObjectName": "serverless/my-service/dev/1498638463280/artifact.zip"
          }
        }
      };

      // console.log(aliyunPackage.serverless.service.getAllFunctions());

      return aliyunPackage.compileFunctions().then(() => {
        expect(consoleLogStub.calledOnce).toEqual(true);
        for (const key in compiledResources) {
          expect(aliyunPackage.serverless.service.provider.compiledConfigurationTemplate.resources[key]).toEqual(compiledResources[key]);
        }
      });
    });

    it('should set the memory size based on the provider configuration', () => {
      aliyunPackage.serverless.service.functions = {
        func1: {
          handler: 'index.func1',
          events: [
            { http: {
              path: '/test',
              method: 'get'
            } },
          ],
        }
      };
      aliyunPackage.serverless.service.provider.memorySize = 1024;

      const compiledResources = {
        "sls-my-service-dev-func1": {
          "type": "ALIYUN::FC::Function",
          "name": "my-service-dev-func1",
          "service": "my-service-dev",
          "handler": "index.func1",
          "memorySize": 1024,
          "timeout": 30,
          "runtime": "nodejs4.4",
          "code": {
            "ossBucketName": "my-service",
            "ossObjectName": "serverless/my-service/dev/1498638463280/artifact.zip"
          }
        }
      };

      return aliyunPackage.compileFunctions().then(() => {
        expect(consoleLogStub.calledOnce).toEqual(true);
        for (const key in compiledResources) {
          expect(aliyunPackage.serverless.service.provider.compiledConfigurationTemplate.resources[key]).toEqual(compiledResources[key]);
        }
      });
    });

    it('should set the timout based on the functions configuration', () => {
      aliyunPackage.serverless.service.functions = {
        func1: {
          handler: 'index.func1',
          timeout: 120,
          events: [
            { http: {
              path: '/test',
              method: 'get'
            } },
          ],
        }
      };

      const compiledResources = {
        "sls-my-service-dev-func1": {
          "type": "ALIYUN::FC::Function",
          "name": "my-service-dev-func1",
          "service": "my-service-dev",
          "handler": "index.func1",
          "memorySize": 128,
          "timeout": 120,
          "runtime": "nodejs4.4",
          "code": {
            "ossBucketName": "my-service",
            "ossObjectName": "serverless/my-service/dev/1498638463280/artifact.zip"
          }
        }
      };

      return aliyunPackage.compileFunctions().then(() => {
        expect(consoleLogStub.calledOnce).toEqual(true);
        for (const key in compiledResources) {
          expect(aliyunPackage.serverless.service.provider.compiledConfigurationTemplate.resources[key]).toEqual(compiledResources[key]);
        }
      });
    });

    it('should set the timeout based on the provider configuration', () => {
      aliyunPackage.serverless.service.functions = {
        func1: {
          handler: 'index.func1',
          events: [
            { http: {
              path: '/test',
              method: 'get'
            } },
          ],
        }
      };
      aliyunPackage.serverless.service.provider.timeout = 120;

      const compiledResources = {
        "sls-my-service-dev-func1": {
          "type": "ALIYUN::FC::Function",
          "name": "my-service-dev-func1",
          "service": "my-service-dev",
          "handler": "index.func1",
          "memorySize": 128,
          "timeout": 120,
          "runtime": "nodejs4.4",
          "code": {
            "ossBucketName": "my-service",
            "ossObjectName": "serverless/my-service/dev/1498638463280/artifact.zip"
          }
        }
      };

      return aliyunPackage.compileFunctions().then(() => {
        expect(consoleLogStub.calledOnce).toEqual(true);
        for (const key in compiledResources) {
          expect(aliyunPackage.serverless.service.provider.compiledConfigurationTemplate.resources[key]).toEqual(compiledResources[key]);
        }
      });

    });

    it('should compile "http" events properly', () => {
      aliyunPackage.serverless.service.functions = {
        func1: {
          handler: 'index.func1',
          events: [
            { http: {
              path: '/test',
              method: 'get'
            }, }
          ],
        },
      };

      const compiledResources = {
        "sls-function-service": {
          "type": "ALIYUN::FC::Service",
          "name": "my-service-dev",
          "region": "cn-hangzhou",
          "id": undefined
        },
        "sls-api-group": {
          "type": "ALIYUN::API::APIGroup",
          "name": "my-service-dev-api",
          "region": "cn-hangzhou",
          "id": undefined,
          "domain": undefined
        },
        "sls-my-service-dev-func1": {
          "type": "ALIYUN::FC::Function",
          "name": "my-service-dev-func1",
          "service": "my-service-dev",
          "handler": "index.func1",
          "memorySize": 128,
          "timeout": 30,
          "runtime": "nodejs4.4",
          "code": {
            "ossBucketName": "my-service",
            "ossObjectName": "serverless/my-service/dev/1498638463280/artifact.zip"
          }
        },
        "sls-http-my-service-dev-func1": {
          "type": "ALIYUN::API::HTTP",
          "groupName": "my-service-dev-api",
          "groupId": undefined,
          "apiName": "sls-http-my-service-dev-func1",
          "protocol": "http",
          "method": "GET",
          "path": "/test",
          "service": {
            "ref": "sls-my-service-dev-func1"
          }
        }
      };

      return aliyunPackage.compileFunctions().then(() => {
        expect(consoleLogStub.calledOnce).toEqual(true);
        for (const key in compiledResources) {
          expect(aliyunPackage.serverless.service.provider.compiledConfigurationTemplate.resources[key]).toEqual(compiledResources[key]);
        }
      });
    });
  });
});
