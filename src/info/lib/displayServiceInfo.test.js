/*global beforeEach, afterEach, expect*/

'use strict';

const sinon = require('sinon');
const chalk = require('chalk');

const path = require('path');
const AliyunProvider = require('../../provider/aliyunProvider');
const AliyunInfo = require('../aliyunInfo');
const Serverless = require('../../test/serverless');
const { fullGroup, fullApis, apis, fullFunctions, functionDefs } = require('../../test/data');

describe('DisplayServiceInfo', () => {
  let serverless;
  let aliyunInfo;

  beforeEach(() => {
    serverless = new Serverless();
    serverless.service.service = 'my-service';
    serverless.service.functions = functionDefs;
    serverless.service.provider = {
      name: 'aliyun',
      credentials: path.join(__dirname, '..', 'test', 'credentials'),
    };
    serverless.config = {
      servicePath: path.join(__dirname, '..', '..', 'test')
    };
    const options = {
      stage: 'dev',
      region: 'cn-shanghai',
    };
    serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
    serverless.pluginManager.setCliOptions(options);
    aliyunInfo = new AliyunInfo(serverless, options);
  });

  describe('#displayServiceInfo()', () => {
    let consoleLogStub;
    let getServiceStub;
    let getFunctionsStub;
    let getApiGroupStub;
    let getApisStub;
    let getApiStub;

    beforeEach(() => {
      consoleLogStub = sinon.stub(aliyunInfo.serverless.cli, 'consoleLog').returns();
      getServiceStub = sinon.stub(aliyunInfo.provider, 'getService');
      getFunctionsStub = sinon.stub(aliyunInfo.provider, 'getFunctions');
      getApiGroupStub = sinon.stub(aliyunInfo.provider, 'getApiGroup');
      getApisStub = sinon.stub(aliyunInfo.provider, 'getApis');
      getApiStub = sinon.stub(aliyunInfo.provider, 'getApi');
    });

    afterEach(() => {
      aliyunInfo.serverless.cli.consoleLog.restore();
      aliyunInfo.provider.getService.restore();
      aliyunInfo.provider.getFunctions.restore();
      aliyunInfo.provider.getApiGroup.restore();
      aliyunInfo.provider.getApis.restore();
      aliyunInfo.provider.getApi.restore();
    });

    it('should print relevant data on the console', () => {
      const serviceId = new Date().getTime().toString(16);
      getServiceStub.returns(Promise.resolve({
        serviceId: serviceId,
        serviceName: 'my-service-dev'
      }));
      getFunctionsStub.returns(Promise.resolve(fullFunctions));
      getApiGroupStub.returns(Promise.resolve(fullGroup));
      getApisStub.returns(Promise.resolve(fullApis));
      getApiStub.onCall(0).returns(Promise.resolve(
        Object.assign({}, apis[0], {
          DeployedInfos: {
            DeployedInfo: [{
              DeployedStatus: 'DEPLOYED',
              StageName: 'RELEASE',
              EffectiveVersion: '20170727201804434'
            }]
          }
        })));
      getApiStub.onCall(1).returns(Promise.resolve(
        Object.assign({}, apis[1], {
          DeployedInfos: {
            DeployedInfo: [{ DeployedStatus: 'NONDEPLOYED', StageName: 'PRE' }]
          }
        })));

      let expectedOutput = [
        `${chalk.yellow.underline('Service Information')}`,
        `${chalk.yellow('service:')} my-service`,
        `${chalk.yellow('stage:')} dev`,
        `${chalk.yellow('region:')} cn-shanghai`,
        '',
        `${chalk.yellow.underline('Functions')}`,
        `- ${chalk.yellow('my-service-dev-postTest')}`,
        '  last modified: 2017-07-21T07:38:41.413Z',
        `- ${chalk.yellow('my-service-dev-getTest')}`,
        '  last modified: 2017-07-21T07:38:41.413Z',
        `- ${chalk.yellow('my-service-dev-ossTriggerTest')}`,
        '  last modified: 2017-07-21T07:38:41.413Z',
        '',
        `${chalk.yellow.underline('Endpoints')}`,
        `API Group: ${chalk.yellow('my_service_dev_api')}`,
        `- ${chalk.yellow('sls_http_my_service_dev_postTest')} (deployed)`,
        '  POST http://523e8dc7bbe04613b5b1d726c2a7889d-cn-shanghai.alicloudapi.com/baz',
        `- ${chalk.yellow('sls_http_my_service_dev_getTest')} (not deployed)`,
        '  GET http://523e8dc7bbe04613b5b1d726c2a7889d-cn-shanghai.alicloudapi.com/quo',
        ''
      ];
      return aliyunInfo.displayServiceInfo().then(() => {
        expect(consoleLogStub.getCall(0).args[0].split('\n')).toEqual(expectedOutput);
      });
    });

    it('should print an info if functions are not yet deployed', () => {
      getServiceStub.returns(Promise.resolve());
      getFunctionsStub.returns(Promise.resolve([]));
      getApiGroupStub.returns(Promise.resolve());
      getApisStub.returns(Promise.resolve([]));
      getApiStub.returns(Promise.resolve());

      let expectedOutput = [
        `${chalk.yellow.underline('Service Information')}`,
        `${chalk.yellow('service:')} my-service`,
        `${chalk.yellow('stage:')} dev`,
        `${chalk.yellow('region:')} cn-shanghai`,
        '',
        `${chalk.yellow.underline('Functions')}`,
        'There are no functions deployed yet',
        '',
        `${chalk.yellow.underline('Endpoints')}`,
        'There are no endpoints yet',
        ''
      ];
      return aliyunInfo.displayServiceInfo().then(() => {
        expect(consoleLogStub.getCall(0).args[0].split('\n')).toEqual(expectedOutput);
      });
    });
  });
});
