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
    const options = {
      stage: 'dev',
      region: 'cn-shanghai',
    };
    serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
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
      "Resources": [
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
      ]
    };

    const expectedResult = {
      "Resources": [
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
      ]
    };

    return aliyunPackage.mergeServiceResources().then(() => {
      expect(serverless.service.provider.compiledConfigurationTemplate)
        .toEqual(expectedResult);
    });
  });
});
