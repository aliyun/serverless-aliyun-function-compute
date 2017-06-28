"use strict";

const AliyunProvider = require('./provider/aliyunProvider');
const AliyunPackage = require('./package/aliyunPackage');
const AliyunDeploy = require('./deploy/aliyunDeploy');
const AliyunDeployFunction = require('./deploy/aliyunDeployFunction');
const AliyunRemove = require('./remove/aliyunRemove');
const AliyunInvoke= require('./invoke/aliyunInvoke');
const AliyunLogs= require('./logs/aliyunLogs');
const AliyunInfo= require('./info/aliyunInfo');

class AliyunIndex {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    // this.serverless.setProvider(
    //   AliyunProvider.getProviderName(), new AliyunProvider(serverless));
    this.serverless.pluginManager.addPlugin(AliyunProvider);
    this.serverless.pluginManager.addPlugin(AliyunPackage);
    this.serverless.pluginManager.addPlugin(AliyunDeploy);
    this.serverless.pluginManager.addPlugin(AliyunDeployFunction);
    this.serverless.pluginManager.addPlugin(AliyunRemove);
    this.serverless.pluginManager.addPlugin(AliyunInvoke);
    this.serverless.pluginManager.addPlugin(AliyunLogs);
    this.serverless.pluginManager.addPlugin(AliyunInfo);
  }
}

module.exports = AliyunIndex;
