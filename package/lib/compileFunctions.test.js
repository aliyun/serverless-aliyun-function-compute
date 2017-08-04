'use strict';

const sinon = require('sinon');
const path = require('path');
const _ = require('lodash');

const AliyunProvider = require('../../provider/aliyunProvider');
const AliyunPackage = require('../aliyunPackage');
const Serverless = require('../../test/serverless');

describe('CompileFunctions', () => {
  let serverless;
  let aliyunPackage;
  let consoleLogStub;
  const directory = 'serverless/my-service/dev/1501150613924-2017-07-27T10:16:53.924Z'

  beforeEach(() => {
    serverless = new Serverless();
    serverless.service.service = 'my-service';
    serverless.service.package = {
      artifact: '/tmp/artifact.zip'
    };
    serverless.config = {
      servicePath: 'my-service'
    };
    serverless.service.provider = {
      compiledConfigurationTemplate: {
        Resources: {
          "sls-storage-bucket": {
            "Type": "ALIYUN::OSS:Bucket",
            "Properties": {
              "BucketName": "sls-my-service",
              "Region": "cn-shanghai"
            }
          },
          "sls-storage-object": {
            "Type": "ALIYUN::OSS:Object",
            "Properties": {
              "BucketName": "sls-my-service",
              "ObjectName": "to-be-replaced-by-serverless",
              "LocalPath": "to-be-replaced-by-serverless"
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
      }
    }
    const options = {
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
    aliyunPackage.serverless.service.functions = {};
    aliyunPackage.serverless.service.provider.memorySize = undefined;
    aliyunPackage.serverless.service.provider.timeout = undefined;
    aliyunPackage.provider.getArtifactDirectoryName.restore();
  });

  describe('#compileFunctions()', () => {
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
              "ossBucketName": "sls-my-service",
              "ossObjectName": "serverless/my-service/dev/1501150613924-2017-07-27T10:16:53.924Z/artifact.zip"
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
              "ossBucketName": "sls-my-service",
              "ossObjectName": "serverless/my-service/dev/1501150613924-2017-07-27T10:16:53.924Z/artifact.zip"
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
              "ossBucketName": "sls-my-service",
              "ossObjectName": "serverless/my-service/dev/1501150613924-2017-07-27T10:16:53.924Z/artifact.zip"
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
              "ossBucketName": "sls-my-service",
              "ossObjectName": "serverless/my-service/dev/1501150613924-2017-07-27T10:16:53.924Z/artifact.zip"
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
    
    const serverlessDirPath = path.join('my-service', '.serverless');
    const compiledResources = {
      "sls-storage-bucket": {
        "Type": "ALIYUN::OSS:Bucket",
        "Properties": {
          "BucketName": "sls-my-service",
          "Region": "cn-shanghai"
        }
      },
      "sls-storage-object": {
        "Type": "ALIYUN::OSS:Object",
        "Properties": {
          "BucketName": "sls-my-service",
          "ObjectName": "serverless/my-service/dev/1501150613924-2017-07-27T10:16:53.924Z/artifact.zip",
          "LocalPath": `${serverlessDirPath}/artifact.zip`
        }
      },
      "sls-function-service": {
        "Type": "ALIYUN::FC::Service",
        "Properties": {
          "name": "my-service-dev",
          "region": "cn-shanghai",
          "id": undefined
        }
      },
      "sls-api-group": {
        "Type": "ALIYUN::API::APIGroup",
        "Properties": {
          "GroupName": "my_service_dev_api",
          "Description": "API group for Function Compute service my-service-dev, generated by the Serverless framework.",
          "Region": "cn-shanghai",
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
            "ossBucketName": "sls-my-service",
            "ossObjectName": "serverless/my-service/dev/1501150613924-2017-07-27T10:16:53.924Z/artifact.zip"
          }
        }
      },
      "sls_http_my_service_dev_func1": {
        "Type": "ALIYUN::API::HTTP",
        "Properties": {
          "GroupName": "my_service_dev_api",
          "GroupId": undefined,
          "ApiName": "sls_http_my_service_dev_func1",
          "Visibility": "PUBLIC",
          "Description": "API for Function Compute function my-service-dev-func1 of service my-service-dev, triggered by http event, generated by the Serverless framework.",
          "AuthType": "ANONYMOUS",
          "RequestConfig": {
            "RequestProtocol": "HTTP",
            "RequestHttpMethod": "POST",
            "RequestPath": "/test",
            "BodyFormat": "FORM",
            "PostBodyDescription": ""
          },
          "ServiceConfig": {
            "ServiceProtocol": "FunctionCompute",
            "Mock": "FALSE",
            "ServiceTimeout": 3000,
            "FunctionComputeConfig": {
              "FcRegionId": "cn-shanghai",
              "ServiceName": "my-service-dev",
              "FunctionName": "my-service-dev-func1"
            },
            "ContentTypeValue": "application/json; charset=UTF-8"
          },
          "RequestParameters": [
            {
              "ApiParameterName": "foo",
              "ParameterType": "String",
              "Location": "Body",
              "Required": "OPTIONAL",
              "isHide": false,
              "DefaultValue": "bar",
              "DemoValue": "bar",
              "Description": "foo"
            }
          ],
          "ServiceParameters": [
            {
              "ServiceParameterName": "foo",
              "Type": "String",
              "Location": "Body",
              "ParameterCatalog": "REQUEST"
            }
          ],
          "ServiceParametersMap": [
            {
              "ServiceParameterName": "foo",
              "RequestParameterName": "foo"
            }
          ],
          "ResultType": "JSON",
          "ResultSample": "{}"
        }
      },
      "sls-fc-invoke-role": {
        "Type": "ALIYUN::RAM::Role",
        "Properties": {
          "RoleName": "sls-my-service-dev-invoke-role",
          "Description": "Allow Function Compute Service my-service-dev to be triggered, generated by the Serverless framework",
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
            "RoleName": "sls-my-service-dev-invoke-role"
          }]
        }
      }
    };

    it('should compile "http" events with "parameters" properly', () => {
      aliyunPackage.serverless.service.functions = {
        func1: {
          handler: 'index.func1',
          events: [{
            http: {
              path: '/test',
              method: 'post',
              bodyFormat: 'form',
              parameters: [{
                name: 'foo',
                type: 'string',
                location: 'body',
                optional: true,
                default: 'bar',
                demo: 'bar',
                description: 'foo'
              }]
            },
          }],
        }
      };
      return aliyunPackage.compileFunctions().then(() => {
        expect(consoleLogStub.calledOnce).toEqual(true);
        expect(aliyunPackage.serverless.service.provider.compiledConfigurationTemplate.Resources).toEqual(compiledResources);
      });
    });

    it('should compile "http" events with "RequestParameters" properly', () => {
      aliyunPackage.serverless.service.functions = {
        func1: {
          handler: 'index.func1',
          events: [{
            http: {
              path: '/test',
              method: 'post',
              BodyFormat: 'FORM',
              "RequestParameters": [{
                "ApiParameterName": "foo",
                "ParameterType": "String",
                "Location": "Body",
                "Required": "OPTIONAL",
                "isHide": false,
                "DefaultValue": "bar",
                "DemoValue": "bar",
                "Description": "foo"
              }],
              "ServiceParameters": [{
                "ServiceParameterName": "foo",
                "Type": "String",
                "Location": "Body",
                "ParameterCatalog": "REQUEST"
              }],
              "ServiceParametersMap": [{
                "ServiceParameterName": "foo",
                "RequestParameterName": "foo"
              }]
            },
          }],
        }
      };

      return aliyunPackage.compileFunctions().then(() => {
        expect(consoleLogStub.calledOnce).toEqual(true);
        expect(aliyunPackage.serverless.service.provider.compiledConfigurationTemplate.Resources).toEqual(compiledResources);
      });
    });

    it('should compile "http" events with default values properly', () => {
      aliyunPackage.serverless.service.functions = {
        func1: {
          handler: 'index.func1',
          events: [{
            http: {
              path: '/test/[id]',
              method: 'get',
              bodyFormat: 'form',
              parameters: [{
                name: 'id',
                type: 'number',
                location: 'path'
              }]
            },
          }],
        }
      };

      const expected = _.cloneDeep(compiledResources);
      Object.assign(expected.sls_http_my_service_dev_func1.Properties, {
        "RequestConfig": {
          "RequestProtocol": "HTTP",
          "RequestHttpMethod": "GET",
          "RequestPath": "/test/[id]",
          "BodyFormat": "FORM",
          "PostBodyDescription": ""
        },
        "RequestParameters": [{
          "ApiParameterName": "id",
          "ParameterType": "Number",
          "Location": "Path",
          "Required": "REQUIRED",
          "isHide": false,
          "DefaultValue": undefined,
          "DemoValue": undefined,
          "Description": ""
        }],
        "ServiceParameters": [{
          "ServiceParameterName": "id",
          "Type": "Number",
          "Location": "Path",
          "ParameterCatalog": "REQUEST"
        }],
        "ServiceParametersMap": [{
          "ServiceParameterName": "id",
          "RequestParameterName": "id"
        }]
      });
      return aliyunPackage.compileFunctions().then(() => {
        expect(consoleLogStub.calledOnce).toEqual(true);
        expect(aliyunPackage.serverless.service.provider.compiledConfigurationTemplate.Resources).toEqual(expected);
      });
    });

    it('should compile "http" events without parameters properly', () => {
      aliyunPackage.serverless.service.functions = {
        func1: {
          handler: 'index.func1',
          events: [{
            http: {
              path: '/test',
              method: 'get'
            },
          }],
        }
      };

      const expected = _.cloneDeep(compiledResources);
      Object.assign(expected.sls_http_my_service_dev_func1.Properties, {
        "RequestConfig": {
          "RequestProtocol": "HTTP",
          "RequestHttpMethod": "GET",
          "RequestPath": "/test",
          "BodyFormat": "",
          "PostBodyDescription": ""
        },
        "RequestParameters": [],
        "ServiceParameters": [],
        "ServiceParametersMap": []
      });

      return aliyunPackage.compileFunctions().then(() => {
        expect(consoleLogStub.calledOnce).toEqual(true);
        expect(aliyunPackage.serverless.service.provider.compiledConfigurationTemplate.Resources).toEqual(expected);
      });
    });
  });
});
