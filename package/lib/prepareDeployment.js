'use strict';

/* eslint no-use-before-define: 0 */

const _ = require('lodash');
const BbPromise = require('bluebird');

module.exports = {
  prepareDeployment() {
    this.provider.initializeTemplate();
    const deploymentTemplate = this.serverless.service.provider.compiledConfigurationTemplate;
    const resources = deploymentTemplate.Resources;

    // resource: oss bucket
    const bucketId = this.provider.getStorageBucketId();
    resources[bucketId] = this.provider.getStorageBucketResource();

    // resource: log project
    const logProjectId = this.provider.getLogProjectId();
    const logProjectResource = this.provider.getLogProjectResource();
    _.merge(resources, { [logProjectId]: logProjectResource});

    // resource: log store
    const logStoreId = this.provider.getLogStoreId();
    const logStoreResource = this.provider.getLogStoreResource();
    _.merge(resources, { [logStoreId]: logStoreResource});

    // resource: log index
    const logIndexId = this.provider.getLogIndexId();
    const logIndexResource = this.provider.getLogIndexResource();
    _.merge(resources, { [logIndexId]: logIndexResource});

    // resource: exec role
    const execRoleId = this.provider.getExecRoleLogicalId();
    const execResource = this.provider.getExecRoleResource();
    this.provider.letExecRoleAccessLog(execResource);
    const ramRoleStatements = this.serverless.service.provider.ramRoleStatements;
    if (Array.isArray(ramRoleStatements)) {
      ramRoleStatements.forEach((stmt) => {
        // TODO: validation
        this.provider.addRamRoleStatementsToExecRole(execResource, stmt);
      });
    }
    resources[execRoleId] = execResource;

    const serviceId = this.provider.getServiceId();
    resources[serviceId] = this.provider.getServiceResource();

    this.serverless.service.provider.compiledConfigurationTemplate = deploymentTemplate;
    return BbPromise.resolve();
  },
};
