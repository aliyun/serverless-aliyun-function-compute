'use strict';

const sinon = require('sinon');
const path = require('path');
const _ = require('lodash');

const AliyunProvider = require('../../provider/aliyunProvider');
const AliyunPackage = require('../aliyunPackage');
const Serverless = require('../../test/serverless');
const createTemplate = require('../../test/.serverless/configuration-template-create.json');
const { ramRoleStatements, functionDefs, directory } = require('../../test/data');

describe('CompileFunctions', () => {
  let serverless;
  let aliyunPackage;
  let consoleLogStub;

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
      credentials: path.join(__dirname, '..', '..', 'test', 'credentials'),
      compiledConfigurationTemplate: _.cloneDeep(createTemplate),
      ramRoleStatements
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

  describe('#CompileFunctions() - function configurations', () => {
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
            "runtime": "nodejs6",
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
            "runtime": "nodejs6",
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
            "runtime": "nodejs6",
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
            "runtime": "nodejs6",
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
  });

  describe('#compileFunctions() - API configurations', () => {
    const compiledResources = require(
      path.join(__dirname, '..', '..', 'test', '.serverless','configuration-template-update.json')).Resources;

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

      const expected = _.cloneDeep(_.pickBy(compiledResources, (value, key) => {
        return key.includes('getTest') || key.includes('postTest') || key.includes('api') || key.includes('invoke');
      }));
      expected['sls-fc-invoke-role'].Properties.AssumeRolePolicyDocument.Statement = [
        {
          "Action": "sts:AssumeRole",
          "Effect": "Allow",
          "Principal": {
            "Service": [
              "apigateway.aliyuncs.com"
            ]
          }
        }
      ];
      const actual = aliyunPackage.serverless.service.provider.compiledConfigurationTemplate.Resources;
      return aliyunPackage.compileFunctions().then(() => {
        expect(consoleLogStub.calledTwice).toEqual(true);
        for (const key in expected) {
          expect(actual).toHaveProperty(key, expected[key]);
        };
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

      const expected = _.cloneDeep(_.pickBy(compiledResources, (value, key) => {
        return key.includes('getTest') || key.includes('postTest') || key.includes('api') || key.includes('invoke');
      }));
      expect(Object.keys(expected).length).toBe(6);
      expected['sls-fc-invoke-role'].Properties.AssumeRolePolicyDocument.Statement = [
        {
          "Action": "sts:AssumeRole",
          "Effect": "Allow",
          "Principal": {
            "Service": [
              "apigateway.aliyuncs.com"
            ]
          }
        }
      ];

      return aliyunPackage.compileFunctions().then(() => {
        expect(consoleLogStub.calledTwice).toEqual(true);
        const actual = aliyunPackage.serverless.service.provider.compiledConfigurationTemplate.Resources;
        for (const key in expected) {
          expect(actual).toHaveProperty(key, expected[key]);
        };
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

      const expected = _.cloneDeep(_.pickBy(compiledResources, (value, key) => {
        return key.includes('getTest') || key.includes('api') || key.includes('invoke');
      }));
      expect(Object.keys(expected).length).toBe(4);
      _.pull(expected['sls-fc-invoke-role'].Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service, 'oss.aliyuncs.com');

      Object.assign(expected.sls_http_my_service_dev_getTest.Properties, {
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
        const actual = aliyunPackage.serverless.service.provider.compiledConfigurationTemplate.Resources;
        for (const key in expected) {
          expect(actual).toHaveProperty(key, expected[key]);
        };
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

      const expected = _.cloneDeep(_.pickBy(compiledResources, (value, key) => {
        return key.includes('getTest') || key.includes('api') || key.includes('invoke');
      }));
      expect(Object.keys(expected).length).toBe(4);
      _.pull(expected['sls-fc-invoke-role'].Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service, 'oss.aliyuncs.com');

      Object.assign(expected.sls_http_my_service_dev_getTest.Properties, {
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
        const actual = aliyunPackage.serverless.service.provider.compiledConfigurationTemplate.Resources;
        for (const key in expected) {
          expect(actual).toHaveProperty(key, expected[key]);
        };
      });
    });
  });

  describe('#compileFunctions() - OSS Trigger configurations', () => {
    const compiledResources = require(
      path.join(__dirname, '..', '..', 'test', '.serverless','configuration-template-update.json')).Resources;

    it('should compile "oss" events properly', () => {
      aliyunPackage.serverless.service.functions = {
        ossTriggerTest: {
          handler: 'index.ossTriggerHandler',
          events: [{
            oss: {
              sourceArn: "acs:oss:cn-shanghai:ttt:my-service-resource",
              triggerConfig: {
                events: [
                  "oss:ObjectCreated:PostObject",
                  "oss:ObjectCreated:PutObject"
                ],
                filter: { key: { prefix: "source/" } }
              }
            },
          }]
        }
      };

      const expected = _.cloneDeep(_.pickBy(compiledResources, (value, key) => {
        return key.includes('ossTriggerTest') || key.includes('invoke');
      }));
      expected['sls-fc-invoke-role'].Properties.AssumeRolePolicyDocument.Statement = [
        {
          "Action": "sts:AssumeRole",
          "Effect": "Allow",
          "Principal": {
            "Service": [
              "oss.aliyuncs.com"
            ]
          }
        }
      ];
      expect(Object.keys(expected).length).toBe(3);
      const actual = aliyunPackage.serverless.service.provider.compiledConfigurationTemplate.Resources;
      return aliyunPackage.compileFunctions().then(() => {
        expect(consoleLogStub.calledOnce).toEqual(true);
        for (const key in expected) {
          expect(actual).toHaveProperty(key, expected[key]);
        };
      });
    });
  });

  describe('#compileFunctions() - storage', () => {
    const compiledResources = require(
      path.join(__dirname, '..', '..', 'test', '.serverless','configuration-template-update.json')).Resources;

    it('should compile storage properly', () => {
      aliyunPackage.serverless.service.functions = functionDefs;

      const expected = _.pick(compiledResources, 'sls-storage-object');
      expect(Object.keys(expected).length).toBe(1);
      const actual = aliyunPackage.serverless.service.provider.compiledConfigurationTemplate.Resources;
      return aliyunPackage.compileFunctions().then(() => {
        for (const key in expected) {
          expect(actual).toHaveProperty(key, expected[key]);
        };
      });
    });
  });

  describe('#compileFunctions() - all', () => {
    const expected = require(
      path.join(__dirname, '..', '..', 'test', '.serverless','configuration-template-update.json')).Resources;

    it('should compile everything properly', () => {
      aliyunPackage.serverless.service.functions = functionDefs;

      const actual = aliyunPackage.serverless.service.provider.compiledConfigurationTemplate.Resources;
      return aliyunPackage.compileFunctions().then(() => {
        expect(consoleLogStub.callCount).toEqual(3);
        expect(actual).toEqual(expected);
      });
    });
  });

  describe('#compileFunction()', () => {
    const compiledResources = require(
      path.join(__dirname, '..', '..', 'test', '.serverless','configuration-template-update.json')).Resources;

    it('should compile a single function properly', () => {
      aliyunPackage.serverless.service.functions = functionDefs;
      const functionName = 'getTest';
      const expected = _.cloneDeep(_.pickBy(compiledResources, (value, key) => {
        return key.includes(functionName) || key.includes('api') || key.includes('invoke') || key.includes('sls-storage-object');
      }));
      expect(Object.keys(expected).length).toBe(5);

      const object = expected['sls-storage-object'].Properties;
      object.LocalPath = object.LocalPath.replace('my-service.zip', 'getTest.zip');
      object.ObjectName = object.ObjectName.replace('my-service.zip', 'getTest.zip');

      const code = expected['sls-my-service-dev-getTest'].Properties.code;
      code.ossObjectName = code.ossObjectName.replace('my-service.zip', 'getTest.zip');

      expected['sls-fc-invoke-role'].Properties.AssumeRolePolicyDocument.Statement = [
        {
          "Action": "sts:AssumeRole",
          "Effect": "Allow",
          "Principal": {
            "Service": [
              "apigateway.aliyuncs.com"
            ]
          }
        }
      ];

      const actual = aliyunPackage.serverless.service.provider.compiledConfigurationTemplate.Resources;
      const funcObject = _.cloneDeep(aliyunPackage.serverless.service.getFunction(functionName));
      funcObject.package = { artifact: '/tmp/getTest.zip' };
      return aliyunPackage.compileFunction(functionName, funcObject).then(() => {
        for (const key in expected) {
          expect(actual).toHaveProperty(key, expected[key]);
        };
      });
    });
  });
});
