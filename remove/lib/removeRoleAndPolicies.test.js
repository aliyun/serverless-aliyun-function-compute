'use strict';

const sinon = require('sinon');
const path = require('path');
const BbPromise = require('bluebird');

const AliyunProvider = require('../../provider/aliyunProvider');
const AliyunRemove = require('../aliyunRemove');
const Serverless = require('../../test/serverless');
const { role, fullRole } = require('../../test/data');

describe('removeRoleAndPolicies', () => {
  let serverless;
  let aliyunRemove;
  const roleName = 'sls-my-service-dev-invoke-role';

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
  });

  describe('#removeRoleAndPolicies()', () => {
    let consoleLogStub;
    let getRoleStub;
    let getPoliciesForRoleStub;
    let detachPolicyFromRoleStub;
    let deleteRoleStub;

    beforeEach(() => {
      const options = {
        stage: 'dev',
        region: 'cn-shanghai',
        'remove-roles': true
      };
      serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
      serverless.pluginManager.setCliOptions(options);
      aliyunRemove = new AliyunRemove(serverless, options);
      consoleLogStub = sinon.stub(aliyunRemove.serverless.cli, 'log').returns();
      getRoleStub = sinon.stub(aliyunRemove.provider, 'getRole');
      getPoliciesForRoleStub = sinon.stub(aliyunRemove.provider, 'getPoliciesForRole');
      detachPolicyFromRoleStub = sinon.stub(aliyunRemove.provider, 'detachPolicyFromRole');
      deleteRoleStub = sinon.stub(aliyunRemove.provider, 'deleteRole');
    });

    afterEach(() => {
      aliyunRemove.serverless.cli.log.restore();
      aliyunRemove.provider.getRole.restore();
      aliyunRemove.provider.getPoliciesForRole.restore();
      aliyunRemove.provider.detachPolicyFromRole.restore();
      aliyunRemove.provider.deleteRole.restore();
    });

    it('should remove existing role and policies', () => {
      getRoleStub.returns(BbPromise.resolve(fullRole));
      getPoliciesForRoleStub.returns(BbPromise.resolve(role.Policies));
      detachPolicyFromRoleStub.returns(BbPromise.resolve());
      deleteRoleStub.returns(BbPromise.resolve());

      return aliyunRemove.removeRoleAndPolicies(roleName).then(() => {
        expect(getRoleStub.calledOnce).toEqual(true);
        expect(getRoleStub.calledWithExactly(roleName)).toEqual(true);
        expect(getPoliciesForRoleStub.calledAfter(getRoleStub)).toEqual(true);
        expect(getPoliciesForRoleStub.calledWithExactly(roleName)).toEqual(true);

        expect(detachPolicyFromRoleStub.calledAfter(getPoliciesForRoleStub)).toEqual(true);
        expect(detachPolicyFromRoleStub.calledOnce).toEqual(true);
        expect(detachPolicyFromRoleStub.calledWithExactly(fullRole, role.Policies[0])).toEqual(true);
        expect(deleteRoleStub.calledAfter(detachPolicyFromRoleStub)).toEqual(true);
        expect(deleteRoleStub.calledWithExactly(roleName)).toEqual(true);

        const logs = [
          'Detaching RAM policy AliyunFCInvocationAccess from sls-my-service-dev-invoke-role...',
          'Detached RAM policy AliyunFCInvocationAccess from sls-my-service-dev-invoke-role',
          'Removing RAM role sls-my-service-dev-invoke-role...',
          'Removed RAM role sls-my-service-dev-invoke-role'
        ];
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
        }
      });
    });

    it('should skip non-existing role and policies', () => {
      getRoleStub.returns(BbPromise.resolve());
      getPoliciesForRoleStub.returns(BbPromise.resolve([]));
      detachPolicyFromRoleStub.returns(BbPromise.resolve());
      deleteRoleStub.returns(BbPromise.resolve());

      return aliyunRemove.removeRoleAndPolicies(roleName).then(() => {
        expect(getRoleStub.calledWithExactly(roleName)).toEqual(true);
        expect(getPoliciesForRoleStub.called).toEqual(false);
        expect(detachPolicyFromRoleStub.called).toEqual(false);
        expect(deleteRoleStub.called).toEqual(false);

        const logs = [];
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
        }
      });
    });
  });


  describe('#removeRoleAndPolicies()', () => {
    let consoleLogStub;
    let getRoleStub;
    let getPoliciesForRoleStub;
    let detachPolicyFromRoleStub;
    let deleteRoleStub;

    beforeEach(() => {
      const options = {
        stage: 'dev',
        region: 'cn-shanghai'
      };
      serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
      serverless.pluginManager.setCliOptions(options);
      aliyunRemove = new AliyunRemove(serverless, options);
      consoleLogStub = sinon.stub(aliyunRemove.serverless.cli, 'log').returns();
      getRoleStub = sinon.stub(aliyunRemove.provider, 'getRole');
      getPoliciesForRoleStub = sinon.stub(aliyunRemove.provider, 'getPoliciesForRole');
      detachPolicyFromRoleStub = sinon.stub(aliyunRemove.provider, 'detachPolicyFromRole');
      deleteRoleStub = sinon.stub(aliyunRemove.provider, 'deleteRole');
    });

    afterEach(() => {
      aliyunRemove.serverless.cli.log.restore();
      aliyunRemove.provider.getRole.restore();
      aliyunRemove.provider.getPoliciesForRole.restore();
      aliyunRemove.provider.detachPolicyFromRole.restore();
      aliyunRemove.provider.deleteRole.restore();
    });

    it('should not do anything if there is no --remove-roles', () => {
      getRoleStub.returns(BbPromise.resolve());
      getPoliciesForRoleStub.returns(BbPromise.resolve([]));
      detachPolicyFromRoleStub.returns(BbPromise.resolve());
      deleteRoleStub.returns(BbPromise.resolve());

      return aliyunRemove.removeRoleAndPolicies(roleName).then(() => {
        expect(getRoleStub.called).toEqual(false);
        expect(getPoliciesForRoleStub.called).toEqual(false);
        expect(detachPolicyFromRoleStub.called).toEqual(false);
        expect(deleteRoleStub.called).toEqual(false);
      });
    });
  });
});
