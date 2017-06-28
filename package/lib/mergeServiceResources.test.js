'use stict';

const AliyunProvider = require('../../provider/aliyunProvider');
const AliyunPackage = require('../aliyunPackage');
const Serverless = require('../../test/serverless');

describe('MergeServiceResources', () => {
  let serverless;
  let aliyunPackage;

  beforeEach(() => {
    serverless = new Serverless();
    serverless.service.service = 'my-service';
    serverless.service.provider = {
      compiledConfigurationTemplate: {},
    };
    serverless.setProvider('aliyun', new AliyunProvider(serverless));
    const options = {
      stage: 'dev',
      region: 'cn-shanghai',
    };
    aliyunPackage = new AliyunPackage(serverless, options);
  });

  it('should resolve if service resources are not defined', () => aliyunPackage
    .mergeServiceResources().then(() => {
      expect(serverless.service.provider
        .compiledConfigurationTemplate).toEqual({});
    }));

  it('should resolve if service resources is empty', () => {
    serverless.service.resources = {};

    return aliyunPackage.mergeServiceResources().then(() => {
      expect(serverless.service.provider
        .compiledConfigurationTemplate).toEqual({});
    });
  });

  it('should merge all the resources if provided', () => {
    serverless.service.provider.compiledConfigurationTemplate = {
      resources: [
        {
          name: 'resource1',
          type: 'type1',
          properties: {
            property1: 'value1',
          },
        },
      ],
    };

    serverless.service.resources = {
      resources: [
        {
          name: 'resource2',
          type: 'type2',
          properties: {
            property1: 'value1',
          },
        },
      ],
      imports: [
        {
          path: 'path/to/template.jinja',
          name: 'my-template',
        },
      ],
    };

    const expectedResult = {
      resources: [
        {
          name: 'resource1',
          type: 'type1',
          properties: {
            property1: 'value1',
          },
        },
        {
          name: 'resource2',
          type: 'type2',
          properties: {
            property1: 'value1',
          },
        },
      ],
      imports: [
        {
          path: 'path/to/template.jinja',
          name: 'my-template',
        },
      ],
    };

    return aliyunPackage.mergeServiceResources().then(() => {
      expect(serverless.service.provider.compiledConfigurationTemplate)
        .toEqual(expectedResult);
    });
  });
});
