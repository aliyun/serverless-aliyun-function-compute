'use strict';

const BbPromise = require('bluebird');

module.exports = {
  removeRoleAndPolicies(roleName) {
    if (!this.options['remove-roles']) {
      return BbPromise.resolve();
    }
    const roleSym = Symbol(roleName);
    const policySym = Symbol(roleName + '-policies');
    this[roleSym] = undefined;
    this[policySym] = [];

    return this.getRamInfo(roleName, roleSym, policySym)
      .then(() => this.removePolicyIfExists(roleName, roleSym, policySym))
      .then(() => this.removeRoleIfExists(roleName, roleSym, policySym));
  },

  getRamInfo(roleName, roleSym, policySym) {
    return this.provider.getRole(roleName)
      .then((foundRole) => {
        if (!foundRole) { return; }
        this[roleSym] = foundRole;
        return this.provider.getPoliciesForRole(roleName)
          .then((policies) => {
            this[policySym] = policies;
          });
      });
  },

  removePolicyIfExists(roleName, roleSym, policySym) {
    if (!this[roleSym] || !this[policySym].length) {
      return;
    }
    const role = this[roleSym];
    const policies = this[policySym];
    return BbPromise.map(policies, (policyProps) => {
      const policyName = policyProps.PolicyName;
      this.serverless.cli.log(`Detaching RAM policy ${policyName} from ${roleName}...`);
      return this.provider.detachPolicyFromRole(role, policyProps).then(() => {
        this.serverless.cli.log(`Detached RAM policy ${policyName} from ${roleName}`);
        return;
      });
    });
  },

  removeRoleIfExists(roleName, roleSym, policySym) {
    if (!this[roleSym]) {
      return;
    }
    this.serverless.cli.log(`Removing RAM role ${roleName}...`);
    return this.provider.deleteRole(roleName)
      .then(() => {
        this.serverless.cli.log(`Removed RAM role ${roleName}`);
      });
  }
};
