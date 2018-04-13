/*global beforeEach, afterEach, expect*/

'use strict';

const path = require('path');

const sinon = require('sinon');

const AliyunProvider = require('../../provider/aliyunProvider');
const AliyunDeploy = require('../aliyunDeploy');
const Serverless = require('../../test/serverless');
const {
  apiGroup, apis, fullGroup, role, fullRole, fullApis,
  triggers, fullTriggers
} = require('../../test/data');

describe('setupEvents', () => {
  let serverless;
  let aliyunDeploy;

  beforeEach(() => {
    serverless = new Serverless();
    serverless.service.service = 'my-service';
    serverless.service.provider = {
      name: 'aliyun',
      credentials: path.join(__dirname, '..', '..', 'test', 'credentials'),
    };
    serverless.config = {
      servicePath: path.join(__dirname, '..', '..', 'test')
    };
    const options = {
      stage: 'dev',
      region: 'cn-shanghai',
    };
    serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
    aliyunDeploy = new AliyunDeploy(serverless, options);    aliyunDeploy.templates = {
      create: require(path.join(__dirname, '..', '..', 'test', '.serverless', 'configuration-template-create.json')),
      update: require(path.join(__dirname, '..', '..', 'test', '.serverless', 'configuration-template-update.json')),
    };
  });

  describe('#setupEvents()', () => {
    let setupInvokeRoleStub;
    let createApisIfNeededStub;
    let createTriggersIfNeededStub;

    beforeEach(() => {
      setupInvokeRoleStub = sinon.stub(aliyunDeploy, 'setupInvokeRole')
        .returns(Promise.resolve(role));
      createApisIfNeededStub = sinon.stub(aliyunDeploy, 'createApisIfNeeded')
        .returns(Promise.resolve());
      createTriggersIfNeededStub = sinon.stub(aliyunDeploy, 'createTriggersIfNeeded')
        .returns(Promise.resolve());
    });

    afterEach(() => {
      aliyunDeploy.setupInvokeRole.restore();
      aliyunDeploy.createApisIfNeeded.restore();
      aliyunDeploy.createTriggersIfNeeded.restore();
    });

    it('should run promise chain', () => aliyunDeploy
      .setupEvents().then(() => {
        expect(setupInvokeRoleStub.calledOnce).toEqual(true);
        expect(createApisIfNeededStub.calledAfter(setupInvokeRoleStub));
        expect(createTriggersIfNeededStub.calledAfter(createApisIfNeededStub));
      })
    );

    it('should set apis and triggers property', () => {
      return aliyunDeploy.setupEvents().then(() => {
        expect(aliyunDeploy.apis).toEqual(apis);
        expect(aliyunDeploy.triggers).toEqual(triggers);
      });
    });
  });

  describe('#setupInvokeRole()', () => {
    let setupRoleStub;

    beforeEach(() => {
      setupRoleStub = sinon.stub(aliyunDeploy, 'setupRole')
        .returns(Promise.resolve(fullRole));
    });

    afterEach(() => {
      aliyunDeploy.setupRole.restore();
    });

    it('should set up invoke role', () => {
      return aliyunDeploy.setupInvokeRole().then(() => {
        expect(setupRoleStub.calledOnce).toEqual(true);
        expect(setupRoleStub.calledWithExactly(role)).toEqual(true);
        expect(aliyunDeploy.invokeRole).toEqual(fullRole);
      });
    });
  });

  describe('#createApisIfNeeded()', () => {
    let getApiGroupStub;
    let createApiGroupStub;
    let getApisStub;
    let updateApiStub;
    let createApiStub;
    let deployApiStub;
    let consoleLogStub;

    beforeEach(() => {
      aliyunDeploy.apis = apis;
      aliyunDeploy.invokeRole = fullRole;

      getApiGroupStub = sinon.stub(aliyunDeploy.provider, 'getApiGroup');
      createApiGroupStub = sinon.stub(aliyunDeploy.provider, 'createApiGroup');
      getApisStub = sinon.stub(aliyunDeploy.provider, 'getApis');
      updateApiStub = sinon.stub(aliyunDeploy.provider, 'updateApi');
      createApiStub = sinon.stub(aliyunDeploy.provider, 'createApi');
      deployApiStub = sinon.stub(aliyunDeploy.provider, 'deployApi');
      consoleLogStub = sinon.stub(aliyunDeploy.serverless.cli, 'log').returns();
    });

    afterEach(() => {
      aliyunDeploy.apis = [];
      aliyunDeploy.invokeRole = undefined;

      aliyunDeploy.provider.getApiGroup.restore();
      aliyunDeploy.provider.createApiGroup.restore();
      aliyunDeploy.provider.getApis.restore();
      aliyunDeploy.provider.updateApi.restore();
      aliyunDeploy.provider.createApi.restore();
      aliyunDeploy.provider.deployApi.restore();
      aliyunDeploy.serverless.cli.log.restore();
    });

    it('should set up apis property from scratch', () => {
      getApiGroupStub.returns(Promise.resolve(undefined));
      createApiGroupStub.returns(Promise.resolve(fullGroup));
      getApisStub.returns(Promise.resolve([]));
      updateApiStub.returns(Promise.resolve());
      createApiStub.onCall(0).returns(Promise.resolve(fullApis[0]));
      createApiStub.onCall(1).returns(Promise.resolve(fullApis[1]));
      deployApiStub.returns(Promise.resolve());

      return aliyunDeploy.createApisIfNeeded().then(() => {
        expect(getApiGroupStub.calledOnce).toEqual(true);
        expect(getApiGroupStub.calledWithExactly('my_service_dev_api')).toEqual(true);

        expect(createApiGroupStub.calledAfter(getApiGroupStub)).toEqual(true);
        expect(createApiGroupStub.calledOnce).toEqual(true);
        expect(createApiGroupStub.calledWithExactly(apiGroup)).toEqual(true);

        expect(getApisStub.calledAfter(createApiGroupStub)).toEqual(true);
        expect(getApisStub.calledOnce).toEqual(true);
        expect(getApisStub.calledWithExactly({
          GroupId: fullGroup.GroupId
        })).toEqual(true);

        expect(updateApiStub.called).toEqual(false);

        expect(createApiStub.calledAfter(getApisStub)).toEqual(true);
        expect(createApiStub.calledTwice).toEqual(true);

        expect(createApiStub.getCall(0).args).toEqual(
          [fullGroup, fullRole, apis[0]]
        );
        expect(createApiStub.getCall(1).args).toEqual(
          [fullGroup, fullRole, apis[1]]
        );

        expect(deployApiStub.calledAfter(createApiStub)).toEqual(true);
        expect(deployApiStub.calledTwice).toEqual(true);
        expect(deployApiStub.getCall(0).args).toEqual(
          [fullGroup, fullApis[0]]
        );
        expect(deployApiStub.getCall(1).args).toEqual(
          [fullGroup, fullApis[1]]
        );

        const logs = [
          'Creating API group my_service_dev_api...',
          'Created API group my_service_dev_api',
          'Creating API sls_http_my_service_dev_postTest...',
          'Created API sls_http_my_service_dev_postTest',
          'Creating API sls_http_my_service_dev_getTest...',
          'Created API sls_http_my_service_dev_getTest',
          'Deploying API sls_http_my_service_dev_postTest...',
          'Deployed API sls_http_my_service_dev_postTest',
          'POST http://523e8dc7bbe04613b5b1d726c2a7889d-cn-shanghai.alicloudapi.com/baz -> my-service-dev.my-service-dev-postTest',
          'Deploying API sls_http_my_service_dev_getTest...',
          'Deployed API sls_http_my_service_dev_getTest',
          'GET http://523e8dc7bbe04613b5b1d726c2a7889d-cn-shanghai.alicloudapi.com/quo -> my-service-dev.my-service-dev-getTest'
        ];
        expect(consoleLogStub.callCount).toEqual(logs.length);
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.calledWithExactly(logs[i])).toEqual(true);
        }
      });
    });

    it('should update apis properly', () => {
      getApiGroupStub.returns(Promise.resolve(fullGroup));
      createApiGroupStub.returns(Promise.resolve());
      getApisStub.returns(Promise.resolve(fullApis));
      createApiStub.returns(Promise.resolve());
      updateApiStub.onCall(0).returns(Promise.resolve(fullApis[0]));
      updateApiStub.onCall(1).returns(Promise.resolve(fullApis[1]));
      deployApiStub.returns(Promise.resolve());

      return aliyunDeploy.createApisIfNeeded().then(() => {
        expect(getApiGroupStub.calledOnce).toEqual(true);
        expect(getApiGroupStub.calledWithExactly('my_service_dev_api')).toEqual(true);

        expect(createApiGroupStub.called).toEqual(false);

        expect(getApisStub.calledAfter(getApiGroupStub)).toEqual(true);
        expect(getApisStub.calledOnce).toEqual(true);
        expect(getApisStub.calledWithExactly({
          GroupId: fullGroup.GroupId
        })).toEqual(true);

        expect(createApiStub.called).toEqual(false);

        expect(updateApiStub.calledAfter(getApisStub)).toEqual(true);
        expect(updateApiStub.calledTwice).toEqual(true);
        expect(updateApiStub.calledWithExactly(
          fullGroup,
          fullRole,
          Object.assign({ApiId: fullApis[0].ApiId}, apis[0])
        )).toEqual(true);
        expect(updateApiStub.calledWithExactly(
          fullGroup,
          fullRole,
          Object.assign({ApiId: fullApis[1].ApiId}, apis[1])
        )).toEqual(true);

        expect(deployApiStub.calledAfter(updateApiStub)).toEqual(true);
        expect(deployApiStub.calledTwice).toEqual(true);
        expect(deployApiStub.calledWithExactly(
          fullGroup,
          fullApis[0]
        )).toEqual(true);
        expect(deployApiStub.calledWithExactly(
          fullGroup,
          fullApis[0]
        )).toEqual(true);

        const logs = [
          'API group my_service_dev_api exists.',
          'Updating API sls_http_my_service_dev_postTest...',
          'Updated API sls_http_my_service_dev_postTest',
          'Updating API sls_http_my_service_dev_getTest...',
          'Updated API sls_http_my_service_dev_getTest',
          'Deploying API sls_http_my_service_dev_postTest...',
          'Deployed API sls_http_my_service_dev_postTest',
          'POST http://523e8dc7bbe04613b5b1d726c2a7889d-cn-shanghai.alicloudapi.com/baz -> my-service-dev.my-service-dev-postTest',
          'Deploying API sls_http_my_service_dev_getTest...',
          'Deployed API sls_http_my_service_dev_getTest',
          'GET http://523e8dc7bbe04613b5b1d726c2a7889d-cn-shanghai.alicloudapi.com/quo -> my-service-dev.my-service-dev-getTest'
        ];
        expect(consoleLogStub.callCount).toEqual(logs.length);
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.calledWithExactly(logs[i])).toEqual(true);
        }
      });
    });
  });

  describe('#createTriggersIfNeeded()', () => {
    let getTriggerStub;
    let updateTriggerStub;
    let createTriggerStub;
    let consoleLogStub;

    beforeEach(() => {
      aliyunDeploy.triggers = triggers;
      aliyunDeploy.invokeRole = fullRole;

      getTriggerStub = sinon.stub(aliyunDeploy.provider, 'getTrigger');
      updateTriggerStub = sinon.stub(aliyunDeploy.provider, 'updateTrigger');
      createTriggerStub = sinon.stub(aliyunDeploy.provider, 'createTrigger');
      consoleLogStub = sinon.stub(aliyunDeploy.serverless.cli, 'log').returns();
    });

    afterEach(() => {
      aliyunDeploy.triggers = [];
      aliyunDeploy.invokeRole = undefined;

      aliyunDeploy.provider.getTrigger.restore();
      aliyunDeploy.provider.updateTrigger.restore();
      aliyunDeploy.provider.createTrigger.restore();
      aliyunDeploy.serverless.cli.log.restore();
    });

    it('should set up triggers from scratch', () => {
      getTriggerStub.returns(Promise.resolve());
      updateTriggerStub.returns(Promise.resolve());
      createTriggerStub.returns(Promise.resolve(fullTriggers[0]));

      return aliyunDeploy.createTriggersIfNeeded().then(() => {
        const trigger = triggers[0];

        expect(getTriggerStub.calledOnce).toEqual(true);
        expect(getTriggerStub.calledWithExactly(
          trigger.serviceName, trigger.functionName, trigger.triggerName
        )).toEqual(true);

        expect(updateTriggerStub.called).toEqual(false);

        expect(createTriggerStub.calledAfter(getTriggerStub)).toEqual(true);
        expect(createTriggerStub.calledOnce).toEqual(true);

        expect(createTriggerStub.getCall(0).args).toEqual(
          [trigger.serviceName, trigger.functionName, trigger, fullRole]
        );

        const logs = [
          'Creating trigger sls_oss_my_service_dev_ossTriggerTest...',
          'Created trigger sls_oss_my_service_dev_ossTriggerTest'
        ];
        expect(consoleLogStub.callCount).toEqual(logs.length);
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.calledWithExactly(logs[i])).toEqual(true);
        }
      });
    });

    it('should update triggers properly', () => {
      getTriggerStub.returns(Promise.resolve(fullTriggers[0]));
      updateTriggerStub.returns(Promise.resolve(fullTriggers[0]));
      createTriggerStub.returns(Promise.resolve());

      return aliyunDeploy.createTriggersIfNeeded().then(() => {
        const trigger = triggers[0];

        expect(getTriggerStub.calledOnce).toEqual(true);
        expect(getTriggerStub.calledWithExactly(
          trigger.serviceName, trigger.functionName, trigger.triggerName
        )).toEqual(true);

        expect(createTriggerStub.called).toEqual(false);

        expect(updateTriggerStub.calledAfter(getTriggerStub)).toEqual(true);
        expect(updateTriggerStub.calledOnce).toEqual(true);
        expect(updateTriggerStub.getCall(0).args).toEqual(
          [trigger.serviceName, trigger.functionName, trigger.triggerName, trigger, fullRole]
        );

        const logs = [
          'Updating trigger sls_oss_my_service_dev_ossTriggerTest...',
          'Updated trigger sls_oss_my_service_dev_ossTriggerTest'
        ];
        expect(consoleLogStub.callCount).toEqual(logs.length);
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.calledWithExactly(logs[i])).toEqual(true);
        }
      });
    });
  });
});
