'use strict';

const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const BbPromise = require('bluebird');

module.exports = {
  setupRole(role) {
    const roleSym = Symbol('role');

    return this.createRoleIfNotExists(role, roleSym)
      .then(() => this.createPoliciesIfNeeded(role, roleSym))
      .then(() => this.attachPoliciesIfNeeded(role, roleSym))
      .then(() => this[roleSym]);
  },

  createRoleIfNotExists(role, roleSym) {
    return this.provider.getRole(role.RoleName)
      .then((foundRole) => {
        if (foundRole) {
          this[roleSym] = foundRole;
          this.serverless.cli.log(`RAM role ${role.RoleName} exists.`);
          return;
        }

        this.serverless.cli.log(`Creating RAM role ${role.RoleName}...`);
        return this.provider.createRole(role)
          .then((createdRole) => {
            this.serverless.cli.log(`Created RAM role ${role.RoleName}`);
            this[roleSym] = createdRole;
          });
      });
  },

  createPoliciesIfNeeded(role, roleSym) {
    if (!this[roleSym]) {
      return;
    }

    return BbPromise.map(role.Policies,
      (policy) => this.createPolicyIfNeeded(policy))
  },

  createPolicyIfNeeded(policy) {
    if (policy.PolicyType === 'System') {
      return BbPromise.resolve();
    }
    const policyName = policy.PolicyName;
    return this.provider.getPolicy(policyName, 'Custom')
      .then((foundPolicy) => {
        if (foundPolicy) {
          this.serverless.cli.log(`RAM policy ${policyName} exists.`);
          return;
        }

        this.serverless.cli.log(`Creating RAM policy ${policyName}...`);
        return this.provider.createPolicy(policy)
          .then((createdPolicy) => {
            this.serverless.cli.log(`Created RAM policy ${policyName}`);
          });
      });
  },

  attachPoliciesIfNeeded(role, roleSym) {
    if (!this[roleSym]) {
      return;
    }
    const roleName = role.RoleName;

    return this.provider.getPoliciesForRole(roleName).then((attached) => {
      return BbPromise.map(role.Policies, (policyProps) => {
        const policyName = policyProps.PolicyName;
        const policy = attached.find(
          (item) => item.PolicyName === policyName
        );
        if (policy) {
          this.serverless.cli.log(`RAM policy ${policyName} has been attached to ${roleName}.`);
          return;
        }

        this.serverless.cli.log(`Attaching RAM policy ${policyName} to ${roleName}...`);
        return this.provider.attachPolicyToRole(role, {
          PolicyName: policyName,
          PolicyType: policyProps.PolicyType || 'Custom'
        }).then(() => {
          this.serverless.cli.log(`Attached RAM policy ${policyName} to ${roleName}`);
        });
      })
    });
  },
};
