'use strict';

module.exports = {
  async setupRole(role) {
    const roleSym = Symbol('role');

    await this.createRoleIfNotExists(role, roleSym);
    await this.createPoliciesIfNeeded(role, roleSym);
    // HACK: must wait for a while for the ram role to take effect
    await this.provider.sleep(this.roleDelay());
    await this.attachPoliciesIfNeeded(role, roleSym);
    return this[roleSym];
  },

  async createRoleIfNotExists(role, roleSym) {
    const foundRole = await this.provider.getRole(role.RoleName);
    if (foundRole) {
      // TODO: update if AssumeRolePolicyDocument is different/smaller
      this[roleSym] = foundRole;
      this.serverless.cli.log(`RAM role ${role.RoleName} exists.`);
      return;
    }
    this.serverless.cli.log(`Creating RAM role ${role.RoleName}...`);
    const createdRole = this.provider.createRole(role);
    this.serverless.cli.log(`Created RAM role ${role.RoleName}`);
    this[roleSym] = createdRole;
  },

  async createPoliciesIfNeeded(role, roleSym) {
    if (!this[roleSym]) {
      return;
    }

    for (var i = 0; i < role.Policies.length; i++) {
      const policy = role.Policies[i];
      await this.createPolicyIfNeeded(policy);
    }
  },

  async createPolicyIfNeeded(policy) {
    if (policy.PolicyType === 'System') {
      return;
    }
    const policyName = policy.PolicyName;
    const foundPolicy = await this.provider.getPolicy(policyName, 'Custom');
    if (foundPolicy) {
      // TODO: Update if PolicyDocument is different
      this.serverless.cli.log(`RAM policy ${policyName} exists.`);
      return;
    }

    this.serverless.cli.log(`Creating RAM policy ${policyName}...`);
    await this.provider.createPolicy(policy);
    this.serverless.cli.log(`Created RAM policy ${policyName}`);
  },

  async attachPoliciesIfNeeded(role, roleSym) {
    if (!this[roleSym]) {
      return;
    }
    const roleName = role.RoleName;

    const attached = await this.provider.getPoliciesForRole(roleName);

    await Promise.all(role.Policies.map(async (policyProps) => {
      const policyName = policyProps.PolicyName;
      const policy = attached.find(
        (item) => item.PolicyName === policyName
      );

      if (policy) {
        this.serverless.cli.log(`RAM policy ${policyName} has been attached to ${roleName}.`);
        return;
      }

      this.serverless.cli.log(`Attaching RAM policy ${policyName} to ${roleName}...`);
      await this.provider.attachPolicyToRole(role, {
        PolicyName: policyName,
        PolicyType: policyProps.PolicyType || 'Custom'
      });
      this.serverless.cli.log(`Attached RAM policy ${policyName} to ${roleName}`);
    }));
  },

  get roleDelay() {
    return 5000;
  },
};
