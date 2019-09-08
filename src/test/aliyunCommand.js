'use strict';

// mock to test functionality in a command unrelated matter
// this mean that not e.g. aliyunDeploy but the more abstract aliyunCommand can be used
class AliyunCommand {
  constructor(serverless, options, testSubject) {
    this.options = options;
    this.serverless = serverless;
    this.provider = this.serverless.getProvider('aliyun');

    Object.assign(
      this,
      testSubject);
  }
}

module.exports = AliyunCommand;
