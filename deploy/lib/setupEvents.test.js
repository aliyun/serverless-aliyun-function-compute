'use strict';

const fs = require('fs');
const path = require('path');

const sinon = require('sinon');
const BbPromise = require('bluebird');

const AliyunProvider = require('../../provider/aliyunProvider');
const AliyunDeploy = require('../aliyunDeploy');
const Serverless = require('../../test/serverless');
const { apiGroup, apis, group, fullGroup, role, fullRole, fullApis, functions } = require('../../test/data');

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
    }
  });

  describe('#setupEvents()', () => {
    let createApisIfNeededStub;
    let createTriggersIfNeededStub;

    beforeEach(() => {
      createApisIfNeededStub = sinon.stub(aliyunDeploy, 'createApisIfNeeded')
        .returns(BbPromise.resolve());
      createTriggersIfNeededStub = sinon.stub(aliyunDeploy, 'createTriggersIfNeeded')
        .returns(BbPromise.resolve());
    });

    afterEach(() => {
      aliyunDeploy.createApisIfNeeded.restore();
      aliyunDeploy.createTriggersIfNeeded.restore();
    });

    it('should run promise chain', () => aliyunDeploy
      .setupEvents().then(() => {
        expect(createApisIfNeededStub.calledOnce).toEqual(true);
        expect(createTriggersIfNeededStub.calledAfter(createApisIfNeededStub));
      })
    );

    it('should set apis property', () => {
      return aliyunDeploy.setupEvents().then(() => {
          expect(aliyunDeploy.apis).toEqual(apis);
        });
      }
    );
  });


  describe('#setupEvents()', () => {
    let getApiGroupStub;
    let createApiGroupStub;
    let getApiRoleStub;
    let createApiRoleStub;
    let getPoliciesStub;
    let createPolicyStub;
    let getApisStub;
    let updateApiStub;
    let createApiStub;
    let deployApiStub;
    let consoleLogStub;

    beforeEach(() => {
      getApiGroupStub = sinon.stub(aliyunDeploy.provider, 'getApiGroup');
      createApiGroupStub = sinon.stub(aliyunDeploy.provider, 'createApiGroup');
      getApiRoleStub = sinon.stub(aliyunDeploy.provider, 'getApiRole');
      createApiRoleStub = sinon.stub(aliyunDeploy.provider, 'createApiRole');
      getPoliciesStub = sinon.stub(aliyunDeploy.provider, 'getPolicies');
      createPolicyStub = sinon.stub(aliyunDeploy.provider, 'createPolicy');
      getApisStub = sinon.stub(aliyunDeploy.provider, 'getApis');
      updateApiStub = sinon.stub(aliyunDeploy.provider, 'updateApi');
      createApiStub = sinon.stub(aliyunDeploy.provider, 'createApi');
      deployApiStub = sinon.stub(aliyunDeploy.provider, 'deployApi');
      consoleLogStub = sinon.stub(aliyunDeploy.serverless.cli, 'log').returns();
    });

    afterEach(() => {      
      aliyunDeploy.provider.getApiGroup.restore();
      aliyunDeploy.provider.createApiGroup.restore();
      aliyunDeploy.provider.getApiRole.restore();
      aliyunDeploy.provider.createApiRole.restore();
      aliyunDeploy.provider.getPolicies.restore();
      aliyunDeploy.provider.createPolicy.restore();
      aliyunDeploy.provider.getApis.restore();
      aliyunDeploy.provider.updateApi.restore();
      aliyunDeploy.provider.createApi.restore();
      aliyunDeploy.provider.deployApi.restore();
      aliyunDeploy.serverless.cli.log.restore();
    });

    it('should set up apis property from scratch', () => {
      getApiGroupStub.returns(BbPromise.resolve(undefined));
      createApiGroupStub.returns(BbPromise.resolve(fullGroup));
      getApiRoleStub.returns(BbPromise.resolve(undefined));
      createApiRoleStub.returns(BbPromise.resolve(fullRole));
      getPoliciesStub.returns(BbPromise.resolve([]));
      createPolicyStub.returns(BbPromise.resolve(role.Policies[0]));
      getApisStub.returns(BbPromise.resolve([]));
      updateApiStub.returns(BbPromise.resolve());
      createApiStub.onCall(0).returns(BbPromise.resolve(fullApis[0]));
      createApiStub.onCall(1).returns(BbPromise.resolve(fullApis[1]));
      deployApiStub.returns(BbPromise.resolve());

      return aliyunDeploy.setupEvents().then(() => {
        expect(getApiGroupStub.calledOnce).toEqual(true);
        expect(getApiGroupStub.calledWithExactly('my_service_dev_api')).toEqual(true);

        expect(createApiGroupStub.calledAfter(getApiGroupStub)).toEqual(true);
        expect(createApiGroupStub.calledOnce).toEqual(true);
        expect(createApiGroupStub.calledWithExactly(apiGroup)).toEqual(true);

        expect(getApiRoleStub.calledAfter(createApiGroupStub)).toEqual(true);
        expect(getApiRoleStub.calledOnce).toEqual(true);
        expect(getApiRoleStub.calledWithExactly('SLSFCInvocationFromAPIGateway')).toEqual(true);

        expect(createApiRoleStub.calledAfter(getApiRoleStub)).toEqual(true);
        expect(createApiRoleStub.calledOnce).toEqual(true);
        expect(createApiRoleStub.calledWithExactly(role)).toEqual(true);

        expect(getPoliciesStub.calledAfter(createApiRoleStub)).toEqual(true);
        expect(getPoliciesStub.calledOnce).toEqual(true);
        expect(getPoliciesStub.calledWithExactly(role)).toEqual(true);

        expect(createPolicyStub.calledAfter(getPoliciesStub)).toEqual(true);
        expect(createPolicyStub.calledOnce).toEqual(true);
        expect(createPolicyStub.calledWithExactly(role.Policies[0])).toEqual(true);

        expect(getApisStub.calledAfter(createPolicyStub)).toEqual(true);
        expect(getApisStub.calledOnce).toEqual(true);
        expect(getApisStub.calledWithExactly({
          GroupId: fullGroup.GroupId
        })).toEqual(true);

        expect(updateApiStub.called).toEqual(false);

        expect(createApiStub.calledAfter(getApisStub)).toEqual(true);
        expect(createApiStub.calledTwice).toEqual(true);

        expect(createApiStub.calledWithExactly(
          fullGroup,
          fullRole,
          apis[0]
        )).toEqual(true);
        expect(createApiStub.calledWithExactly(
          fullGroup,
          fullRole,
          apis[1]
        )).toEqual(true);

        expect(deployApiStub.calledAfter(createApiStub)).toEqual(true);
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
          'Creating API group my_service_dev_api...',
          'Created API group my_service_dev_api',
          'Creating RAM role SLSFCInvocationFromAPIGateway...',
          'Created RAM role SLSFCInvocationFromAPIGateway',
          'Attaching RAM policy AliyunFCInvocationAccess to SLSFCInvocationFromAPIGateway...',
          'Attached RAM policy AliyunFCInvocationAccess to SLSFCInvocationFromAPIGateway',
          'Creating API sls_http_my_service_dev_currentTime...',
          'Created API sls_http_my_service_dev_currentTime',
          'Creating API sls_http_my_service_dev_currentTime2...',
          'Created API sls_http_my_service_dev_currentTime2',
          'Deploying API sls_http_my_service_dev_currentTime...',
          'Deployed API sls_http_my_service_dev_currentTime',
          'POST http://523e8dc7bbe04613b5b1d726c2a7889d-cn-shanghai.alicloudapi.com/ping -> my-service-dev.my-service-dev-currentTime',
          'Deploying API sls_http_my_service_dev_currentTime2...',
          'Deployed API sls_http_my_service_dev_currentTime2',
          'GET http://523e8dc7bbe04613b5b1d726c2a7889d-cn-shanghai.alicloudapi.com/ping2 -> my-service-dev.my-service-dev-currentTime2'
        ];
        expect(consoleLogStub.callCount).toEqual(logs.length);
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.calledWithExactly(logs[i])).toEqual(true);
        }
      });
    });

    it('should update apis properly', () => {
      getApiGroupStub.returns(BbPromise.resolve(fullGroup));
      createApiGroupStub.returns(BbPromise.resolve());
      getApiRoleStub.returns(BbPromise.resolve(fullRole));
      createApiRoleStub.returns(BbPromise.resolve());
      getPoliciesStub.returns(BbPromise.resolve(role.Policies));
      createPolicyStub.returns(BbPromise.resolve());
      getApisStub.returns(BbPromise.resolve(fullApis));
      createApiStub.returns(BbPromise.resolve());
      updateApiStub.onCall(0).returns(BbPromise.resolve(fullApis[0]));
      updateApiStub.onCall(1).returns(BbPromise.resolve(fullApis[1]));
      deployApiStub.returns(BbPromise.resolve());

      return aliyunDeploy.setupEvents().then(() => {
        expect(getApiGroupStub.calledOnce).toEqual(true);
        expect(getApiGroupStub.calledWithExactly('my_service_dev_api')).toEqual(true);

        expect(createApiGroupStub.called).toEqual(false);

        expect(getApiRoleStub.calledAfter(getApiGroupStub)).toEqual(true);
        expect(getApiRoleStub.calledOnce).toEqual(true);
        expect(getApiRoleStub.calledWithExactly('SLSFCInvocationFromAPIGateway')).toEqual(true);

        expect(createApiRoleStub.called).toEqual(false);

        expect(getPoliciesStub.calledAfter(getApiRoleStub)).toEqual(true);
        expect(getPoliciesStub.called).toEqual(true);
        expect(getPoliciesStub.calledWithExactly(role)).toEqual(true);

        expect(createPolicyStub.called).toEqual(false);

        expect(getApisStub.calledAfter(getPoliciesStub)).toEqual(true);
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
          'RAM role SLSFCInvocationFromAPIGateway exists.',
          'RAM policy AliyunFCInvocationAccess exists.',
          'Updating API sls_http_my_service_dev_currentTime...',
          'Updated API sls_http_my_service_dev_currentTime',
          'Updating API sls_http_my_service_dev_currentTime2...',
          'Updated API sls_http_my_service_dev_currentTime2',
          'Deploying API sls_http_my_service_dev_currentTime...',
          'Deployed API sls_http_my_service_dev_currentTime',
          'POST http://523e8dc7bbe04613b5b1d726c2a7889d-cn-shanghai.alicloudapi.com/ping -> my-service-dev.my-service-dev-currentTime',
          'Deploying API sls_http_my_service_dev_currentTime2...',
          'Deployed API sls_http_my_service_dev_currentTime2',
          'GET http://523e8dc7bbe04613b5b1d726c2a7889d-cn-shanghai.alicloudapi.com/ping2 -> my-service-dev.my-service-dev-currentTime2'
        ];
        expect(consoleLogStub.callCount).toEqual(logs.length);
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.calledWithExactly(logs[i])).toEqual(true);
        }
      });
    });
  });
});
