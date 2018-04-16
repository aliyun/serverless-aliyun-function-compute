'use strict';

module.exports = {
  async setupService() {
    this.logProjectSpec = this.templates.create.Resources[this.provider.getLogProjectId()].Properties;
    this.logStoreSpec = this.templates.create.Resources[this.provider.getLogStoreId()].Properties;
    this.logIndexSpec = this.templates.create.Resources[this.provider.getLogIndexId()].Properties;

    this.logProject = undefined;
    this.logStore = undefined;
    this.logIndex = undefined;

    await this.createLogConfigIfNotExists();
    await this.setupExecRole();
    // HACK: must wait for a while for the ram policy to take effect
    await this.provider.sleep(this.provider.PROJECT_DELAY);
    const foundService = await this.checkForExistingService();
    await this.createServiceIfNotExists(foundService);
    await this.createBucketIfNotExists();
  },

  async setupExecRole() {
    const role = this.templates.create.Resources[this.provider.getExecRoleLogicalId()].Properties;
    this.execRole = await this.setupRole(role);
  },

  async createLogConfigIfNotExists() {
    await this.createLogProjectIfNotExists();
    await this.createLogStoreIfNotExists();
    await this.createLogIndexIfNotExists();
  },

  async createLogProjectIfNotExists() {
    const projectName = this.logProjectSpec.projectName;
    const logProject = await this.provider.getLogProject(projectName);
    if (logProject) {
      this.serverless.cli.log(`Log project ${projectName} already exists.`);
      this.logProject = logProject;
      return;
    }

    this.serverless.cli.log(`Creating log project ${projectName}...`);
    const createdProject = await this.provider.createLogProject(projectName, this.logProjectSpec);
    this.serverless.cli.log(`Created log project ${projectName}`);
    this.logProject = createdProject;
  },

  async createLogStoreIfNotExists() {
    if (!this.logProject) {
      return;
    }
    const projectName = this.logProjectSpec.projectName;
    const storeName = this.logStoreSpec.storeName;
    const logStore = await this.provider.getLogStore(projectName, storeName);

    if (logStore) {
      this.serverless.cli.log(`Log store ${projectName}/${storeName} already exists.`);
      this.logStore = logStore;
      return;
    }

    this.serverless.cli.log(`Creating log store ${projectName}/${storeName}...`);
    const createdStore = await this.provider.createLogStore(projectName, storeName, this.logStoreSpec);

    this.serverless.cli.log(`Created log store ${projectName}/${storeName}`);
    this.logStore = createdStore;
  },

  createLogIndexIfNotExists() {
    if (!this.logProject || !this.logStore) {
      return;
    }
    const projectName = this.logProjectSpec.projectName;
    const storeName = this.logStoreSpec.storeName;
    return this.provider.getLogIndex(projectName, storeName)
      .then((logIndex) => {
        if (logIndex) {
          this.serverless.cli.log(`Log store ${projectName}/${storeName} already has an index.`);
          this.logIndex = logIndex;
          return;
        }

        this.serverless.cli.log(`Creating log index for ${projectName}/${storeName}...`);
        return this.provider.createLogIndex(projectName, storeName, this.logIndexSpec)
          .then((createdIndex) => {
            this.serverless.cli.log(`Created log index for ${projectName}/${storeName}`);
            this.logIndex = createdIndex;
          });
      });
  },

  checkForExistingService() {
    const service = this.templates.create.Resources[this.provider.getServiceId()].Properties;

    return this.provider.getService(service.name);
  },

  async createServiceIfNotExists(foundService) {
    const service = this.templates.create.Resources[this.provider.getServiceId()].Properties;

    if (foundService) {
      this.serverless.cli.log(`Service ${service.name} already exists.`);
      return;
    }

    this.serverless.cli.log(`Creating service ${service.name}...`);
    // TODO(joyeecheung): generate description
    // TODO(joyeecheung): update service
    const spec = Object.assign({
      role: this.execRole.Arn
    }, service);
    await this.provider.createService(service.name, spec);
    this.serverless.cli.log(`Created service ${service.name}`);
  },

  async createBucketIfNotExists() {
    const bucket = this.templates.create.Resources[this.provider.getStorageBucketId()].Properties;

    const foundBucket = await this.provider.getBucket(bucket.BucketName);
    if (foundBucket) {
      this.serverless.cli.log(`Bucket ${bucket.BucketName} already exists.`);
    } else {
      this.serverless.cli.log(`Creating bucket ${bucket.BucketName}...`);
      await this.provider.createBucket(bucket.BucketName);
      this.serverless.cli.log(`Created bucket ${bucket.BucketName}`);
    }

    this.provider.resetOssClient(bucket.BucketName);
  }
};
