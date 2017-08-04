'use strict';

const sinon = require('sinon');
const path = require('path');
const BbPromise = require('bluebird');

const AliyunProvider = require('../../provider/aliyunProvider');
const AliyunRemove = require('../aliyunRemove');
const Serverless = require('../../test/serverless');
const { fullGroup, fullApis, role, fullRole } = require('../../test/data');

const functionDefs = {
  postTest: {
    handler: 'index.postHandler',
    events: [
      { http: {
        path: '/baz',
        method: 'post'
      } },
    ],
  },
  getTest: {
    handler: 'index.getHandler',
    events: [
      { http: {
        path: '/quo',
        method: 'get'
      } },
    ],
  }
};

describe('removeEvents', () => {
  let serverless;
  let aliyunRemove;

  beforeEach(() => {
    serverless = new Serverless();
    serverless.service.service = 'my-service';
    serverless.service.provider = {
      name: 'aliyun',
      credentials: path.join(__dirname, '..', '..', 'test', 'credentials')
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
    aliyunRemove = new AliyunRemove(serverless, options);
  });

  describe('#removeEvents()', () => {
    let consoleLogStub;
    let getApiGroupStub;
    let getApisStub;
    let getDeployedApisStub;
    let abolishApiStub;
    let deleteApiStub;
    let getRoleStub;
    let getPoliciesForRoleStub;
    let detachPolicyFromRoleStub;
    let deleteRoleStub;
    let deleteApiGroupStub;

    beforeEach(() => {
      aliyunRemove.serverless.service.functions = {};
      consoleLogStub = sinon.stub(aliyunRemove.serverless.cli, 'log').returns();
      getApiGroupStub = sinon.stub(aliyunRemove.provider, 'getApiGroup');
      getApisStub = sinon.stub(aliyunRemove.provider, 'getApis');
      getDeployedApisStub = sinon.stub(aliyunRemove.provider, 'getDeployedApis');
      abolishApiStub = sinon.stub(aliyunRemove.provider, 'abolishApi');
      deleteApiStub = sinon.stub(aliyunRemove.provider, 'deleteApi');
      getRoleStub = sinon.stub(aliyunRemove.provider, 'getRole');
      getPoliciesForRoleStub = sinon.stub(aliyunRemove.provider, 'getPoliciesForRole');
      detachPolicyFromRoleStub = sinon.stub(aliyunRemove.provider, 'detachPolicyFromRole');
      deleteRoleStub = sinon.stub(aliyunRemove.provider, 'deleteRole');
      deleteApiGroupStub = sinon.stub(aliyunRemove.provider, 'deleteApiGroup');
    });

    afterEach(() => {
      aliyunRemove.serverless.cli.log.restore();
      aliyunRemove.provider.getApiGroup.restore();
      aliyunRemove.provider.getApis.restore();
      aliyunRemove.provider.getDeployedApis.restore();
      aliyunRemove.provider.abolishApi.restore();
      aliyunRemove.provider.getRole.restore();
      aliyunRemove.provider.getPoliciesForRole.restore();
      aliyunRemove.provider.detachPolicyFromRole.restore();
      aliyunRemove.provider.deleteRole.restore();
      aliyunRemove.provider.deleteApi.restore();
      aliyunRemove.provider.deleteApiGroup.restore();
    });

    it('should remove existing events', () => {
      aliyunRemove.serverless.service.functions = functionDefs;
      getApiGroupStub.returns(BbPromise.resolve(fullGroup));
      getApisStub.returns(BbPromise.resolve(fullApis));
      getDeployedApisStub.returns(BbPromise.resolve(fullApis));
      abolishApiStub.returns(BbPromise.resolve());
      deleteApiStub.returns(BbPromise.resolve());
      getRoleStub.returns(BbPromise.resolve(fullRole));
      getPoliciesForRoleStub.returns(BbPromise.resolve(role.Policies));
      detachPolicyFromRoleStub.returns(BbPromise.resolve());
      deleteRoleStub.returns(BbPromise.resolve());
      deleteApiGroupStub.returns(BbPromise.resolve());

      return aliyunRemove.removeEvents().then(() => {
        expect(getApiGroupStub.calledOnce).toEqual(true);
        expect(getApiGroupStub.calledWithExactly('my_service_dev_api')).toEqual(true);

        expect(getApisStub.calledAfter(getApiGroupStub)).toEqual(true);
        expect(getApisStub.calledOnce).toEqual(true);
        expect(getApisStub.calledWithExactly({
          GroupId: fullGroup.GroupId
        })).toEqual(true);

        expect(getDeployedApisStub.calledAfter(getApisStub)).toEqual(true);
        expect(getDeployedApisStub.calledOnce).toEqual(true);
        expect(getDeployedApisStub.calledWithExactly({
          GroupId: fullGroup.GroupId
        })).toEqual(true);

        expect(abolishApiStub.calledAfter(getDeployedApisStub)).toEqual(true);
        expect(abolishApiStub.calledTwice).toEqual(true);
        expect(abolishApiStub.getCall(0).args)
          .toEqual([ fullGroup, fullApis[0] ]);
        expect(abolishApiStub.getCall(1).args)
          .toEqual([ fullGroup, fullApis[1] ]);

        expect(deleteApiStub.calledAfter(abolishApiStub)).toEqual(true);
        expect(deleteApiStub.calledTwice).toEqual(true);
        expect(deleteApiStub.getCall(0).args)
          .toEqual([ fullGroup, fullApis[0] ]);
        expect(deleteApiStub.getCall(1).args)
          .toEqual([ fullGroup, fullApis[1] ]);

        expect(getRoleStub.calledAfter(deleteApiStub)).toEqual(true);
        expect(getRoleStub.calledWithExactly('sls-my-service-dev-invoke-role')).toEqual(true);
        expect(getPoliciesForRoleStub.calledAfter(getRoleStub)).toEqual(true);
        expect(getPoliciesForRoleStub.calledWithExactly('sls-my-service-dev-invoke-role')).toEqual(true);

        expect(detachPolicyFromRoleStub.calledAfter(getPoliciesForRoleStub)).toEqual(true);
        expect(detachPolicyFromRoleStub.calledOnce).toEqual(true);
        expect(detachPolicyFromRoleStub.calledWithExactly(fullRole, role.Policies[0])).toEqual(true);
        expect(deleteRoleStub.calledAfter(detachPolicyFromRoleStub)).toEqual(true);
        expect(deleteRoleStub.calledWithExactly('sls-my-service-dev-invoke-role')).toEqual(true);

        expect(deleteApiGroupStub.calledAfter(deleteRoleStub)).toEqual(true);
        expect(deleteApiGroupStub.calledOnce).toEqual(true);
        expect(deleteApiGroupStub.calledWithExactly(fullGroup)).toEqual(true);

        const logs = [
          'Removing events...',
          'Abolishing API sls_http_my_service_dev_postTest...',
          'Abolished API sls_http_my_service_dev_postTest',
          'Abolishing API sls_http_my_service_dev_getTest...',
          'Abolished API sls_http_my_service_dev_getTest',
          'Removing API sls_http_my_service_dev_postTest...',
          'Removed API sls_http_my_service_dev_postTest',
          'Removing API sls_http_my_service_dev_getTest...',
          'Removed API sls_http_my_service_dev_getTest',
          'Detaching RAM policy AliyunFCInvocationAccess from sls-my-service-dev-invoke-role...',
          'Detached RAM policy AliyunFCInvocationAccess from sls-my-service-dev-invoke-role',
          'Removing RAM role sls-my-service-dev-invoke-role...',
          'Removed RAM role sls-my-service-dev-invoke-role',
          'Removing API group my_service_dev_api...',
          'Removed API group my_service_dev_api'
        ];
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
        }
      });
    });

    it('should only abolish deployed apis', () => {
      aliyunRemove.serverless.service.functions = functionDefs;
      getApiGroupStub.returns(BbPromise.resolve(fullGroup));
      getApisStub.returns(BbPromise.resolve(fullApis));
      getDeployedApisStub.returns(BbPromise.resolve([fullApis[0]]));
      abolishApiStub.returns(BbPromise.resolve());
      deleteApiStub.returns(BbPromise.resolve());
      getRoleStub.returns(BbPromise.resolve(fullRole));
      getPoliciesForRoleStub.returns(BbPromise.resolve(role.Policies));
      detachPolicyFromRoleStub.returns(BbPromise.resolve());
      deleteRoleStub.returns(BbPromise.resolve());
      deleteApiGroupStub.returns(BbPromise.resolve());

      return aliyunRemove.removeEvents().then(() => {
        expect(abolishApiStub.calledAfter(getDeployedApisStub)).toEqual(true);
        expect(abolishApiStub.calledOnce).toEqual(true);
        expect(abolishApiStub.getCall(0).args)
          .toEqual([ fullGroup, fullApis[0] ]);

        expect(deleteApiStub.calledAfter(abolishApiStub)).toEqual(true);
        expect(deleteApiStub.calledTwice).toEqual(true);
        expect(deleteApiStub.getCall(0).args)
          .toEqual([ fullGroup, fullApis[0] ]);
        expect(deleteApiStub.getCall(1).args)
          .toEqual([ fullGroup, fullApis[1] ]);

        expect(getRoleStub.calledAfter(deleteApiStub)).toEqual(true);
        expect(getRoleStub.calledWithExactly('sls-my-service-dev-invoke-role')).toEqual(true);
        expect(getPoliciesForRoleStub.calledAfter(getRoleStub)).toEqual(true);
        expect(getPoliciesForRoleStub.calledWithExactly('sls-my-service-dev-invoke-role')).toEqual(true);

        expect(detachPolicyFromRoleStub.calledAfter(getPoliciesForRoleStub)).toEqual(true);
        expect(detachPolicyFromRoleStub.calledOnce).toEqual(true);
        expect(detachPolicyFromRoleStub.calledWithExactly(fullRole, role.Policies[0])).toEqual(true);
        expect(deleteRoleStub.calledAfter(detachPolicyFromRoleStub)).toEqual(true);
        expect(deleteRoleStub.calledWithExactly('sls-my-service-dev-invoke-role')).toEqual(true);

        expect(deleteApiGroupStub.calledAfter(deleteRoleStub)).toEqual(true);
        expect(deleteApiGroupStub.calledOnce).toEqual(true);
        expect(deleteApiGroupStub.calledWithExactly(fullGroup)).toEqual(true);

        const logs = [
          'Removing events...',
          'Abolishing API sls_http_my_service_dev_postTest...',
          'Abolished API sls_http_my_service_dev_postTest',
          'Removing API sls_http_my_service_dev_postTest...',
          'Removed API sls_http_my_service_dev_postTest',
          'Removing API sls_http_my_service_dev_getTest...',
          'Removed API sls_http_my_service_dev_getTest',
          'Detaching RAM policy AliyunFCInvocationAccess from sls-my-service-dev-invoke-role...',
          'Detached RAM policy AliyunFCInvocationAccess from sls-my-service-dev-invoke-role',
          'Removing RAM role sls-my-service-dev-invoke-role...',
          'Removed RAM role sls-my-service-dev-invoke-role',
          'Removing API group my_service_dev_api...',
          'Removed API group my_service_dev_api'
        ];
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
        }
      });
    });

    it('should only delete existing apis', () => {
      aliyunRemove.serverless.service.functions = functionDefs;
      getApiGroupStub.returns(BbPromise.resolve(fullGroup));
      getApisStub.returns(BbPromise.resolve([fullApis[0]]));
      getDeployedApisStub.returns(BbPromise.resolve([]));
      abolishApiStub.returns(BbPromise.resolve());
      deleteApiStub.returns(BbPromise.resolve());
      getRoleStub.returns(BbPromise.resolve(fullRole));
      getPoliciesForRoleStub.returns(BbPromise.resolve(role.Policies));
      detachPolicyFromRoleStub.returns(BbPromise.resolve());
      deleteRoleStub.returns(BbPromise.resolve());
      deleteApiGroupStub.returns(BbPromise.resolve());

      return aliyunRemove.removeEvents().then(() => {
        expect(abolishApiStub.called).toEqual(false);
        expect(deleteApiStub.calledOnce).toEqual(true);
        expect(deleteApiStub.getCall(0).args)
          .toEqual([ fullGroup, fullApis[0] ]);

        expect(getRoleStub.calledAfter(deleteApiStub)).toEqual(true);
        expect(getRoleStub.calledWithExactly('sls-my-service-dev-invoke-role')).toEqual(true);
        expect(getPoliciesForRoleStub.calledAfter(getRoleStub)).toEqual(true);
        expect(getPoliciesForRoleStub.calledWithExactly('sls-my-service-dev-invoke-role')).toEqual(true);

        expect(detachPolicyFromRoleStub.calledAfter(getPoliciesForRoleStub)).toEqual(true);
        expect(detachPolicyFromRoleStub.calledOnce).toEqual(true);
        expect(detachPolicyFromRoleStub.calledWithExactly(fullRole, role.Policies[0])).toEqual(true);
        expect(deleteRoleStub.calledAfter(detachPolicyFromRoleStub)).toEqual(true);
        expect(deleteRoleStub.calledWithExactly('sls-my-service-dev-invoke-role')).toEqual(true);

        expect(deleteApiGroupStub.calledAfter(deleteRoleStub)).toEqual(true);
        expect(deleteApiGroupStub.calledOnce).toEqual(true);
        expect(deleteApiGroupStub.calledWithExactly(fullGroup)).toEqual(true);

        const logs = [
          'Removing events...',
          'No deployed APIs to abolish.',
          'Removing API sls_http_my_service_dev_postTest...',
          'Removed API sls_http_my_service_dev_postTest',
          'Detaching RAM policy AliyunFCInvocationAccess from sls-my-service-dev-invoke-role...',
          'Detached RAM policy AliyunFCInvocationAccess from sls-my-service-dev-invoke-role',
          'Removing RAM role sls-my-service-dev-invoke-role...',
          'Removed RAM role sls-my-service-dev-invoke-role',
          'Removing API group my_service_dev_api...',
          'Removed API group my_service_dev_api'
        ];
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
        }
      });
    });

    it('should not do anything if no apis have been setup before', () => {
      aliyunRemove.serverless.service.functions = functionDefs;
      getApiGroupStub.returns(BbPromise.resolve(undefined));
      getApisStub.returns(BbPromise.resolve([]));
      getDeployedApisStub.returns(BbPromise.resolve([]));
      abolishApiStub.returns(BbPromise.resolve());
      deleteApiStub.returns(BbPromise.resolve());
      getRoleStub.returns(BbPromise.resolve());
      getPoliciesForRoleStub.returns(BbPromise.resolve([]));
      detachPolicyFromRoleStub.returns(BbPromise.resolve());
      deleteRoleStub.returns(BbPromise.resolve());
      deleteApiGroupStub.returns(BbPromise.resolve());

      return aliyunRemove.removeEvents().then(() => {
        expect(abolishApiStub.called).toEqual(false);
        expect(deleteApiStub.called).toEqual(false);
        expect(deleteApiGroupStub.called).toEqual(false);
        expect(getRoleStub.calledWithExactly('sls-my-service-dev-invoke-role')).toEqual(true);
        expect(getPoliciesForRoleStub.called).toEqual(false);
        expect(detachPolicyFromRoleStub.called).toEqual(false);
        expect(deleteRoleStub.called).toEqual(false);

        const logs = [
          'Removing events...',
          'No deployed APIs to abolish.',
          'No APIs to remove.',
          'No API groups to remove.',
        ];
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
        }
      });
    });
  });
});
