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
    let getRoleStub;
    let createRoleStub;
    let getPoliciesForRoleStub;
    let attachPolicyToRoleStub;
    let getApisStub;
    let updateApiStub;
    let createApiStub;
    let deployApiStub;
    let consoleLogStub;

    beforeEach(() => {
      getApiGroupStub = sinon.stub(aliyunDeploy.provider, 'getApiGroup');
      createApiGroupStub = sinon.stub(aliyunDeploy.provider, 'createApiGroup');
      getRoleStub = sinon.stub(aliyunDeploy.provider, 'getRole');
      createRoleStub = sinon.stub(aliyunDeploy.provider, 'createRole');
      getPoliciesForRoleStub = sinon.stub(aliyunDeploy.provider, 'getPoliciesForRole');
      attachPolicyToRoleStub = sinon.stub(aliyunDeploy.provider, 'attachPolicyToRole');
      getApisStub = sinon.stub(aliyunDeploy.provider, 'getApis');
      updateApiStub = sinon.stub(aliyunDeploy.provider, 'updateApi');
      createApiStub = sinon.stub(aliyunDeploy.provider, 'createApi');
      deployApiStub = sinon.stub(aliyunDeploy.provider, 'deployApi');
      consoleLogStub = sinon.stub(aliyunDeploy.serverless.cli, 'log').returns();
    });

    afterEach(() => {      
      aliyunDeploy.provider.getApiGroup.restore();
      aliyunDeploy.provider.createApiGroup.restore();
      aliyunDeploy.provider.getRole.restore();
      aliyunDeploy.provider.createRole.restore();
      aliyunDeploy.provider.getPoliciesForRole.restore();
      aliyunDeploy.provider.attachPolicyToRole.restore();
      aliyunDeploy.provider.getApis.restore();
      aliyunDeploy.provider.updateApi.restore();
      aliyunDeploy.provider.createApi.restore();
      aliyunDeploy.provider.deployApi.restore();
      aliyunDeploy.serverless.cli.log.restore();
    });

    it('should set up apis property from scratch', () => {
      getApiGroupStub.returns(BbPromise.resolve(undefined));
      createApiGroupStub.returns(BbPromise.resolve(fullGroup));
      getRoleStub.returns(BbPromise.resolve(undefined));
      createRoleStub.returns(BbPromise.resolve(fullRole));
      getPoliciesForRoleStub.returns(BbPromise.resolve([]));
      attachPolicyToRoleStub.returns(BbPromise.resolve(role.Policies[0]));
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

        expect(getRoleStub.calledAfter(createApiGroupStub)).toEqual(true);
        expect(getRoleStub.calledOnce).toEqual(true);
        expect(getRoleStub.calledWithExactly('sls-my-service-dev-invoke-role')).toEqual(true);

        expect(createRoleStub.calledAfter(getRoleStub)).toEqual(true);
        expect(createRoleStub.calledOnce).toEqual(true);
        expect(createRoleStub.calledWithExactly(role)).toEqual(true);

        expect(getPoliciesForRoleStub.calledAfter(createRoleStub)).toEqual(true);
        expect(getPoliciesForRoleStub.calledOnce).toEqual(true);
        expect(getPoliciesForRoleStub.calledWithExactly(role.RoleName)).toEqual(true);

        expect(attachPolicyToRoleStub.calledAfter(getPoliciesForRoleStub)).toEqual(true);
        expect(attachPolicyToRoleStub.calledOnce).toEqual(true);
        expect(attachPolicyToRoleStub.calledWithExactly(role.Policies[0])).toEqual(true);

        expect(getApisStub.calledAfter(attachPolicyToRoleStub)).toEqual(true);
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
          'Creating RAM role sls-my-service-dev-invoke-role...',
          'Created RAM role sls-my-service-dev-invoke-role',
          'Attaching RAM policy AliyunFCInvocationAccess to sls-my-service-dev-invoke-role...',
          'Attached RAM policy AliyunFCInvocationAccess to sls-my-service-dev-invoke-role',
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
      getApiGroupStub.returns(BbPromise.resolve(fullGroup));
      createApiGroupStub.returns(BbPromise.resolve());
      getRoleStub.returns(BbPromise.resolve(fullRole));
      createRoleStub.returns(BbPromise.resolve());
      getPoliciesForRoleStub.returns(BbPromise.resolve(role.Policies));
      attachPolicyToRoleStub.returns(BbPromise.resolve());
      getApisStub.returns(BbPromise.resolve(fullApis));
      createApiStub.returns(BbPromise.resolve());
      updateApiStub.onCall(0).returns(BbPromise.resolve(fullApis[0]));
      updateApiStub.onCall(1).returns(BbPromise.resolve(fullApis[1]));
      deployApiStub.returns(BbPromise.resolve());

      return aliyunDeploy.setupEvents().then(() => {
        expect(getApiGroupStub.calledOnce).toEqual(true);
        expect(getApiGroupStub.calledWithExactly('my_service_dev_api')).toEqual(true);

        expect(createApiGroupStub.called).toEqual(false);

        expect(getRoleStub.calledAfter(getApiGroupStub)).toEqual(true);
        expect(getRoleStub.calledOnce).toEqual(true);
        expect(getRoleStub.calledWithExactly('sls-my-service-dev-invoke-role')).toEqual(true);

        expect(createRoleStub.called).toEqual(false);

        expect(getPoliciesForRoleStub.calledAfter(getRoleStub)).toEqual(true);
        expect(getPoliciesForRoleStub.called).toEqual(true);
        expect(getPoliciesForRoleStub.calledWithExactly(role.RoleName)).toEqual(true);

        expect(attachPolicyToRoleStub.called).toEqual(false);

        expect(getApisStub.calledAfter(getPoliciesForRoleStub)).toEqual(true);
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
          'RAM role sls-my-service-dev-invoke-role exists.',
          'RAM policy AliyunFCInvocationAccess exists.',
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
});
