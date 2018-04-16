'use strict';

module.exports = {
  async removeRoleAndPolicies(roleName) {
    if (!this.options['remove-roles']) {
      return;
    }
    const roleSym = Symbol(roleName);
    const policySym = Symbol(roleName + '-policies');
    this[roleSym] = undefined;
    this[policySym] = [];

    await this.getRamInfo(roleName, roleSym, policySym);
    await this.removePolicyIfExists(roleName, roleSym, policySym);
    await this.removeRoleIfExists(roleName, roleSym, policySym);
  },

  async getRamInfo(roleName, roleSym, policySym) {
    const foundRole = await this.provider.getRole(roleName);
    if (!foundRole) {
      return;
    }
    this[roleSym] = foundRole;
    this[policySym] = await this.provider.getPoliciesForRole(roleName);
  },

  async removePolicyIfExists(roleName, roleSym, policySym) {
    if (!this[roleSym] || !this[policySym].length) {
      return;
    }
    const role = this[roleSym];
    const policies = this[policySym];
    for (var i = 0; i < policies.length; i++) {
      const policyProps = policies[i];
      const policyName = policyProps.PolicyName;
      this.serverless.cli.log(`Detaching RAM policy ${policyName} from ${roleName}...`);
      await this.provider.detachPolicyFromRole(role, policyProps);
      this.serverless.cli.log(`Detached RAM policy ${policyName} from ${roleName}`);
    }
  },

  async removeRoleIfExists(roleName, roleSym, policySym) {
    if (!this[roleSym]) {
      return;
    }
    this.serverless.cli.log(`Removing RAM role ${roleName}...`);
    await this.provider.deleteRole(roleName);
    this.serverless.cli.log(`Removed RAM role ${roleName}`);
  }
};
