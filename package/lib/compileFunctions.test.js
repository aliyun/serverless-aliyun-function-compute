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
  const directory = 'serverless/my-service/dev/1500622721413-2017-07-21T07:38:41.413Z'

  beforeEach(() => {
    serverless = new Serverless();
    serverless.service.service = 'my-service';
    serverless.service.package = {
      artifact: '/tmp/my-service.zip'
    };
    serverless.config = {
      servicePath: '/projects/'
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
              "ossObjectName": "serverless/my-service/dev/1500622721413-2017-07-21T07:38:41.413Z/my-service.zip"
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
              "ossObjectName": "serverless/my-service/dev/1500622721413-2017-07-21T07:38:41.413Z/my-service.zip"
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
              "ossObjectName": "serverless/my-service/dev/1500622721413-2017-07-21T07:38:41.413Z/my-service.zip"
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
              "ossObjectName": "serverless/my-service/dev/1500622721413-2017-07-21T07:38:41.413Z/my-service.zip"
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

    const compiledResources = require(
      path.join(__dirname, '..', '..', 'test', '.serverless','configuration-template-update.json')).Resources;

    // TODO(joyeecheung): need to implement log store creation first
    compiledResources['sls-fc-exec-role'].Properties.Policies = [];

    it('should compile "http" events with "parameters" properly', () => {
      aliyunPackage.serverless.service.functions = {
        postTest: {
          handler: 'index.postHandler',
          events: [{
            http: {
              path: '/baz',
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
        },
        getTest: {
          handler: 'index.getHandler',
          events: [{
            http: {
              path: '/quo',
              method: 'get'
            }
          }]
        }
      };

      return aliyunPackage.compileFunctions().then(() => {
        expect(consoleLogStub.calledTwice).toEqual(true);
        expect(aliyunPackage.serverless.service.provider.compiledConfigurationTemplate.Resources).toEqual(compiledResources);
      });
    });

    it('should compile "http" events with "RequestParameters" properly', () => {
      aliyunPackage.serverless.service.functions = {
        postTest: {
          handler: 'index.postHandler',
          events: [{
            http: {
              path: '/baz',
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
        },
        getTest: {
          handler: 'index.getHandler',
          events: [{
            http: {
              RequestPath: '/quo',
              RequestHttpMethod: 'get'
            }
          }]
        }
      };

      return aliyunPackage.compileFunctions().then(() => {
        expect(consoleLogStub.calledTwice).toEqual(true);
        expect(aliyunPackage.serverless.service.provider.compiledConfigurationTemplate.Resources).toEqual(compiledResources);
      });
    });

    it('should compile "http" events with default values properly', () => {
      aliyunPackage.serverless.service.functions = {
        getTest: {
          handler: 'index.getHandler',
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

      const expected = _.cloneDeep(compiledResources.sls_http_my_service_dev_getTest.Properties);
      Object.assign(expected, {
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
        const actual = aliyunPackage.serverless.service.provider.compiledConfigurationTemplate.Resources.sls_http_my_service_dev_getTest.Properties;
        expect(consoleLogStub.calledOnce).toEqual(true);
        expect(actual).toEqual(expected);
      });
    });

    it('should compile "http" events without parameters properly', () => {
      aliyunPackage.serverless.service.functions = {
        getTest: {
          handler: 'index.getHandler',
          events: [{
            http: {
              path: '/test',
              method: 'get'
            },
          }],
        }
      };

      const expected = _.cloneDeep(compiledResources.sls_http_my_service_dev_getTest.Properties);
      Object.assign(expected, {
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
        const actual = aliyunPackage.serverless.service.provider.compiledConfigurationTemplate.Resources.sls_http_my_service_dev_getTest.Properties;
        expect(consoleLogStub.calledOnce).toEqual(true);
        expect(actual).toEqual(expected);
      });
    });
  });
});
