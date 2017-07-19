'use strict';

const sinon = require('sinon');
const path = require('path');

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
      artifact: '/tmp/artifact.zip',
      artifactDirectoryName: 'serverless/my-service/dev/1498638463280',
    };
    serverless.config = {
      servicePath: 'my-service'
    };
    serverless.service.stage = 'dev';
    serverless.service.provider = {
      compiledConfigurationTemplate: {
        Resources: {
          "sls-storage-bucket": {
            "Type": "ALIYUN::OSS:Bucket",
            "Properties": {
              "BucketName": "my-service",
              "Region": "cn-hangzhou"
            }
          },
          "sls-storage-object": {
            "Type": "ALIYUN::OSS:Object",
            "Properties": {
              "BucketName": "my-service",
              "ObjectName": "to-be-replaced-by-serverless",
              "LocalPath": "to-be-replaced-by-serverless"
            }
          },
          "sls-function-service": {
            "Type": "ALIYUN::FC::Service",
            "Properties": {
              "name": "my-service-dev",
              "region": "cn-hangzhou"
            }
          }
        }
      },
      deploymentBucketName: 'my-service'
    }
    const options = {
      stage: 'dev',
      region: 'cn-hangzhou',
    };
    serverless.setProvider('aliyun', new AliyunProvider(serverless, options));

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
          "Type": "ALIYUN::FC::Function",
          "Properties": {
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
        }
      };

      // console.log(aliyunPackage.serverless.service.getAllFunctions());

      return aliyunPackage.compileFunctions().then(() => {
        expect(consoleLogStub.calledOnce).toEqual(true);
        for (const key in compiledResources) {
          expect(aliyunPackage.serverless.service.provider.compiledConfigurationTemplate.Resources[key]).toEqual(compiledResources[key]);
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
          "Type": "ALIYUN::FC::Function",
          "Properties": {
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
        }
      };

      return aliyunPackage.compileFunctions().then(() => {
        expect(consoleLogStub.calledOnce).toEqual(true);
        for (const key in compiledResources) {
          expect(aliyunPackage.serverless.service.provider.compiledConfigurationTemplate.Resources[key]).toEqual(compiledResources[key]);
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
          "Type": "ALIYUN::FC::Function",
          "Properties": {
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
        }
      };

      return aliyunPackage.compileFunctions().then(() => {
        expect(consoleLogStub.calledOnce).toEqual(true);
        for (const key in compiledResources) {
          expect(aliyunPackage.serverless.service.provider.compiledConfigurationTemplate.Resources[key]).toEqual(compiledResources[key]);
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
          "Type": "ALIYUN::FC::Function",
          "Properties": {
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
        }
      };

      return aliyunPackage.compileFunctions().then(() => {
        expect(consoleLogStub.calledOnce).toEqual(true);
        for (const key in compiledResources) {
          expect(aliyunPackage.serverless.service.provider.compiledConfigurationTemplate.Resources[key]).toEqual(compiledResources[key]);
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
      const serverlessDirPath = path.join('my-service', '.serverless');

      const compiledResources = {
        "sls-storage-bucket": {
          "Type": "ALIYUN::OSS:Bucket",
          "Properties": {
            "BucketName": "my-service",
            "Region": "cn-hangzhou"
            
          }
        },
        "sls-storage-object": {
          "Type": "ALIYUN::OSS:Object",
          "Properties": {
            "BucketName": "my-service",
            "ObjectName": "serverless/my-service/dev/1498638463280/artifact.zip",
            "LocalPath": `${serverlessDirPath}/artifact.zip`
          }
        },
        "sls-function-service": {
          "Type": "ALIYUN::FC::Service",
          "Properties": {
            "name": "my-service-dev",
            "region": "cn-hangzhou",
            "id": undefined
          }
        },
        "sls-api-group": {
          "Type": "ALIYUN::API::APIGroup",
          "Properties": {
            "GroupName": "my-service-dev-api",
            "Description": "API group for Function Compute service my-service-dev, generated by the Serverless framework.",
            "Region": "cn-hangzhou",
            "GroupId": undefined,
            "SubDomain": undefined
          }
        },
        "sls-my-service-dev-func1": {
          "Type": "ALIYUN::FC::Function",
          "Properties": {
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
          }
        },
        "sls-http-my-service-dev-func1": {
          "Type": "ALIYUN::API::HTTP",
          "Properties": {
            "GroupName": "my-service-dev-api",
            "GroupId": undefined,
            "ApiName": "sls-http-my-service-dev-func1",
            "Visibility": "PUBLIC",
            "Description": "API for Function Compute function my-service-dev-func1 of service my-service-dev, triggered by http event, generated by the Serverless framework.",
            "AuthType": "ANONYMOUS",
            "RequestProtocol": "HTTP",
            "RequestHttpMethod": "GET",
            "RequestPath": "/test",
            "RequestParameters": [],
            "ServiceConfig": {
              "Ref": "sls-my-service-dev-func1"
            }
          }
        },
        "sls-api-fc-invocation-role": {
          "Type": "ALIYUN::RAM::Role",
          "Properties": {
            "RoleName": "SLSFCInvocationFromAPIGateway",
            "Description": "Allow Function Compute Service to be visited by API Gateway, generated by the Serverless framework",
            "AssumeRolePolicyDocument": {
              "Version": "1",
              "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": { "Service": [ "apigateway.aliyuncs.com" ] }
              }]
            },
            "Policies": [{
              "PolicyType": "System",
              "PolicyName": "AliyunFCInvocationAccess",
              "RoleName": "SLSFCInvocationFromAPIGateway"
            }]
          }
        }
      };

      return aliyunPackage.compileFunctions().then(() => {
        expect(consoleLogStub.calledOnce).toEqual(true);
        expect(aliyunPackage.serverless.service.provider.compiledConfigurationTemplate.Resources).toEqual(compiledResources);
      });
    });
  });
});
