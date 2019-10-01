/*global beforeEach, afterEach, expect*/

'use strict';

const path = require('path');

const sinon = require('sinon');

const AliyunProvider = require('../../provider/aliyunProvider');
const AliyunDeploy = require('../aliyunDeploy');
const Serverless = require('../../test/serverless');
const { role, fullRole, execRole, fullExecRole } = require('../../test/data');

describe('setupRole', () => {
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

  describe('#setupRole()', () => {
    let consoleLogStub;
    let getRoleStub;
    let createRoleStub;
    let getPoliciesForRoleStub;
    let getPolicyStub;
    let createPolicyStub;
    let attachPolicyToRoleStub;
    let roleDelayStub;

    beforeEach(() => {
      getRoleStub = sinon.stub(aliyunDeploy.provider, 'getRole');
      createRoleStub = sinon.stub(aliyunDeploy.provider, 'createRole');
      getPolicyStub = sinon.stub(aliyunDeploy.provider, 'getPolicy');
      createPolicyStub = sinon.stub(aliyunDeploy.provider, 'createPolicy');
      getPoliciesForRoleStub = sinon.stub(aliyunDeploy.provider, 'getPoliciesForRole');
      attachPolicyToRoleStub = sinon.stub(aliyunDeploy.provider, 'attachPolicyToRole');
      consoleLogStub = sinon.stub(aliyunDeploy.serverless.cli, 'log').returns();
      roleDelayStub = sinon.stub(aliyunDeploy.provider, 'roleDelay');
    });

    afterEach(() => {
      aliyunDeploy.provider.getRole.restore();
      aliyunDeploy.provider.createRole.restore();
      aliyunDeploy.provider.getPoliciesForRole.restore();
      aliyunDeploy.provider.getPolicy.restore();
      aliyunDeploy.provider.createPolicy.restore();
      aliyunDeploy.serverless.cli.log.restore();
      roleDelayStub.restore();
    });

    it('should set up role with system policies', () => {
      getRoleStub.returns(Promise.resolve(undefined));
      createRoleStub.returns(Promise.resolve(fullRole));
      getPolicyStub.returns(Promise.resolve(undefined));
      createPolicyStub.returns(Promise.resolve({}));
      getPoliciesForRoleStub.returns(Promise.resolve([]));
      attachPolicyToRoleStub.returns(Promise.resolve());
      roleDelayStub.get(() => 0);

      return aliyunDeploy.setupRole(role).then((completedRole) => {
        expect(completedRole).toEqual(fullRole);
        expect(getRoleStub.calledOnce).toEqual(true);
        expect(getRoleStub.calledWithExactly(role.RoleName)).toEqual(true);

        expect(createRoleStub.calledAfter(getRoleStub)).toEqual(true);
        expect(createRoleStub.calledOnce).toEqual(true);
        expect(createRoleStub.calledWithExactly(role)).toEqual(true);

        expect(getPolicyStub.called).toEqual(false);
        expect(createPolicyStub.called).toEqual(false);

        expect(getPoliciesForRoleStub.calledAfter(createRoleStub)).toEqual(true);
        expect(getPoliciesForRoleStub.calledOnce).toEqual(true);
        expect(getPoliciesForRoleStub.calledWithExactly(role.RoleName)).toEqual(true);

        expect(attachPolicyToRoleStub.calledAfter(getPoliciesForRoleStub)).toEqual(true);
        expect(attachPolicyToRoleStub.calledOnce).toEqual(true);
        expect(attachPolicyToRoleStub.getCall(0).args).toEqual([role, {
          PolicyType: 'System',
          PolicyName: role.Policies[0].PolicyName
        }]);

        const logs = [
          'Creating RAM role sls-my-service-dev-cn-shanghai-invoke-role...',
          'Created RAM role sls-my-service-dev-cn-shanghai-invoke-role',
          'Attaching RAM policy AliyunFCInvocationAccess to sls-my-service-dev-cn-shanghai-invoke-role...',
          'Attached RAM policy AliyunFCInvocationAccess to sls-my-service-dev-cn-shanghai-invoke-role'
        ];
        expect(consoleLogStub.callCount).toEqual(logs.length);
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.getCall(i).args[0]).toEqual((logs[i]));
        }
      });
    });

    it('should update role with system policies', () => {
      getRoleStub.returns(Promise.resolve(fullRole));
      createRoleStub.returns(Promise.resolve(fullRole));
      getPolicyStub.returns(Promise.resolve(undefined));
      createPolicyStub.returns(Promise.resolve({}));
      getPoliciesForRoleStub.returns(Promise.resolve([]));
      attachPolicyToRoleStub.returns(Promise.resolve());
      roleDelayStub.get(() => 0);

      return aliyunDeploy.setupRole(role).then((completedRole) => {
        expect(completedRole).toEqual(fullRole);
        expect(getRoleStub.calledOnce).toEqual(true);
        expect(getRoleStub.calledWithExactly(role.RoleName)).toEqual(true);

        expect(createRoleStub.called).toEqual(false);
        expect(getPolicyStub.called).toEqual(false);
        expect(createPolicyStub.called).toEqual(false);

        expect(getPoliciesForRoleStub.calledAfter(getRoleStub)).toEqual(true);
        expect(getPoliciesForRoleStub.calledOnce).toEqual(true);
        expect(getPoliciesForRoleStub.calledWithExactly(role.RoleName)).toEqual(true);

        expect(attachPolicyToRoleStub.calledAfter(getPoliciesForRoleStub)).toEqual(true);
        expect(attachPolicyToRoleStub.calledOnce).toEqual(true);
        expect(attachPolicyToRoleStub.getCall(0).args).toEqual([role, {
          PolicyType: 'System',
          PolicyName: role.Policies[0].PolicyName
        }]);

        const logs = [
          'RAM role sls-my-service-dev-cn-shanghai-invoke-role exists.',
          'Attaching RAM policy AliyunFCInvocationAccess to sls-my-service-dev-cn-shanghai-invoke-role...',
          'Attached RAM policy AliyunFCInvocationAccess to sls-my-service-dev-cn-shanghai-invoke-role'
        ];
        expect(consoleLogStub.callCount).toEqual(logs.length);
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.getCall(i).args[0]).toEqual((logs[i]));
        }
      });
    });

    it('should skip attached policies', () => {
      getRoleStub.returns(Promise.resolve(fullRole));
      createRoleStub.returns(Promise.resolve(fullRole));
      getPolicyStub.returns(Promise.resolve(undefined));
      createPolicyStub.returns(Promise.resolve({}));
      getPoliciesForRoleStub.returns(Promise.resolve(role.Policies));
      attachPolicyToRoleStub.returns(Promise.resolve());
      roleDelayStub.get(() => 0);

      return aliyunDeploy.setupRole(role).then((completedRole) => {
        expect(completedRole).toEqual(fullRole);
        expect(getRoleStub.calledOnce).toEqual(true);
        expect(getRoleStub.calledWithExactly(role.RoleName)).toEqual(true);

        expect(createRoleStub.called).toEqual(false);
        expect(getPolicyStub.called).toEqual(false);
        expect(createPolicyStub.called).toEqual(false);

        expect(getPoliciesForRoleStub.calledAfter(getRoleStub)).toEqual(true);
        expect(getPoliciesForRoleStub.calledOnce).toEqual(true);
        expect(getPoliciesForRoleStub.calledWithExactly(role.RoleName)).toEqual(true);

        expect(attachPolicyToRoleStub.called).toEqual(false);

        const logs = [
          'RAM role sls-my-service-dev-cn-shanghai-invoke-role exists.',
          'RAM policy AliyunFCInvocationAccess has been attached to sls-my-service-dev-cn-shanghai-invoke-role.',
        ];
        expect(consoleLogStub.callCount).toEqual(logs.length);
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.getCall(i).args[0]).toEqual((logs[i]));
        }
      });
    });

    it('should set up role with custom policies', () => {
      getRoleStub.returns(Promise.resolve(undefined));
      createRoleStub.returns(Promise.resolve(fullExecRole));
      getPolicyStub.returns(Promise.resolve(undefined));
      createPolicyStub.returns(Promise.resolve({}));
      getPoliciesForRoleStub.returns(Promise.resolve([]));
      attachPolicyToRoleStub.returns(Promise.resolve());
      roleDelayStub.get(() => 0);

      return aliyunDeploy.setupRole(execRole).then((completedRole) => {
        expect(completedRole).toEqual(fullExecRole);
        expect(getRoleStub.calledOnce).toEqual(true);
        expect(getRoleStub.calledWithExactly(execRole.RoleName)).toEqual(true);

        expect(createRoleStub.calledAfter(getRoleStub)).toEqual(true);
        expect(createRoleStub.calledOnce).toEqual(true);
        expect(createRoleStub.calledWithExactly(execRole)).toEqual(true);

        expect(getPolicyStub.calledAfter(createRoleStub)).toEqual(true);
        expect(getPolicyStub.calledOnce).toEqual(true);
        expect(getPolicyStub.calledWithExactly(execRole.Policies[0].PolicyName, 'Custom')).toEqual(true);

        expect(createPolicyStub.calledAfter(getPolicyStub)).toEqual(true);
        expect(createPolicyStub.calledOnce).toEqual(true);
        expect(createPolicyStub.calledWithExactly(execRole.Policies[0])).toEqual(true);

        expect(getPoliciesForRoleStub.calledAfter(createPolicyStub)).toEqual(true);
        expect(getPoliciesForRoleStub.calledOnce).toEqual(true);
        expect(getPoliciesForRoleStub.calledWithExactly(execRole.RoleName)).toEqual(true);

        expect(attachPolicyToRoleStub.calledAfter(getPoliciesForRoleStub)).toEqual(true);
        expect(attachPolicyToRoleStub.calledOnce).toEqual(true);
        expect(attachPolicyToRoleStub.getCall(0).args).toEqual([execRole, {
          PolicyType: 'Custom',
          PolicyName: execRole.Policies[0].PolicyName
        }]);

        const logs = [
          'Creating RAM role sls-my-service-dev-cn-shanghai-exec-role...',
          'Created RAM role sls-my-service-dev-cn-shanghai-exec-role',
          'Creating RAM policy fc-my-service-dev-cn-shanghai-access...',
          'Created RAM policy fc-my-service-dev-cn-shanghai-access',
          'Attaching RAM policy fc-my-service-dev-cn-shanghai-access to sls-my-service-dev-cn-shanghai-exec-role...',
          'Attached RAM policy fc-my-service-dev-cn-shanghai-access to sls-my-service-dev-cn-shanghai-exec-role'
        ];
        expect(consoleLogStub.callCount).toEqual(logs.length);
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.getCall(i).args[0]).toEqual((logs[i]));
        }
      });
    });

    it('should not recreate existing policies', () => {
      getRoleStub.returns(Promise.resolve(undefined));
      createRoleStub.returns(Promise.resolve(fullExecRole));
      getPolicyStub.returns(Promise.resolve({
        PolicyType: 'Custom',
        PolicyName: execRole.Policies[0].PolicyName
      }));
      createPolicyStub.returns(Promise.resolve({}));
      getPoliciesForRoleStub.returns(Promise.resolve([]));
      attachPolicyToRoleStub.returns(Promise.resolve());
      roleDelayStub.get(() => 0);

      return aliyunDeploy.setupRole(execRole).then((completedRole) => {
        expect(completedRole).toEqual(fullExecRole);
        expect(getRoleStub.calledOnce).toEqual(true);
        expect(getRoleStub.calledWithExactly(execRole.RoleName)).toEqual(true);

        expect(createRoleStub.calledAfter(getRoleStub)).toEqual(true);
        expect(createRoleStub.calledOnce).toEqual(true);
        expect(createRoleStub.calledWithExactly(execRole)).toEqual(true);

        expect(getPolicyStub.calledAfter(createRoleStub)).toEqual(true);
        expect(getPolicyStub.calledOnce).toEqual(true);
        expect(getPolicyStub.calledWithExactly(execRole.Policies[0].PolicyName, 'Custom')).toEqual(true);

        expect(createPolicyStub.called).toEqual(false);

        expect(getPoliciesForRoleStub.calledAfter(getPolicyStub)).toEqual(true);
        expect(getPoliciesForRoleStub.calledOnce).toEqual(true);
        expect(getPoliciesForRoleStub.calledWithExactly(execRole.RoleName)).toEqual(true);

        expect(attachPolicyToRoleStub.calledAfter(getPoliciesForRoleStub)).toEqual(true);
        expect(attachPolicyToRoleStub.calledOnce).toEqual(true);
        expect(attachPolicyToRoleStub.getCall(0).args).toEqual([execRole, {
          PolicyType: 'Custom',
          PolicyName: execRole.Policies[0].PolicyName
        }]);

        const logs = [
          'Creating RAM role sls-my-service-dev-cn-shanghai-exec-role...',
          'Created RAM role sls-my-service-dev-cn-shanghai-exec-role',
          'RAM policy fc-my-service-dev-cn-shanghai-access exists.',
          'Attaching RAM policy fc-my-service-dev-cn-shanghai-access to sls-my-service-dev-cn-shanghai-exec-role...',
          'Attached RAM policy fc-my-service-dev-cn-shanghai-access to sls-my-service-dev-cn-shanghai-exec-role'
        ];
        expect(consoleLogStub.callCount).toEqual(logs.length);
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.getCall(i).args[0]).toEqual((logs[i]));
        }
      });
    });
  });
});
