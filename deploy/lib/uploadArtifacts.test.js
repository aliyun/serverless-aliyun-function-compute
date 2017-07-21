'use strict';

const fs = require('fs');
const path = require('path');

const sinon = require('sinon');
const BbPromise = require('bluebird');

const AliyunProvider = require('../../provider/aliyunProvider');
const AliyunDeploy = require('../aliyunDeploy');
const Serverless = require('../../test/serverless');

describe('UploadArtifacts', () => {
  let serverless;
  let aliyunDeploy;

  beforeEach(() => {
    serverless = new Serverless();
    serverless.service.service = 'my-service';
    serverless.service.package = {
      artifactFilePath: '/some-remote-file-path',
      artifact: 'artifact.zip'
    }
    serverless.service.provider = {
      name: 'aliyun',
      credentials: path.join(__dirname, '..', '..', 'test', 'credentials')
    };
    serverless.config = {
      servicePath: path.join(__dirname, '..', '..', 'test')
    };
    const options = {
      stage: 'dev',
      region: 'cn-hangzhou',
    };
    serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
    aliyunDeploy = new AliyunDeploy(serverless, options);
    aliyunDeploy.provider.resetOssClient('test-bucket');    aliyunDeploy.templates = {
      create: require(path.join(__dirname, '..', '..', 'test', '.serverless', 'configuration-template-create.json')),
      update: require(path.join(__dirname, '..', '..', 'test', '.serverless', 'configuration-template-update.json')),
    }
  });

  describe('#uploadArtifacts()', () => {
    let consoleLogStub;
    let uploadObjectStub;

    beforeEach(() => {
      consoleLogStub = sinon.stub(aliyunDeploy.serverless.cli, 'log').returns();
      uploadObjectStub = sinon.stub(aliyunDeploy.provider, 'uploadObject');
    });

    afterEach(() => {
      aliyunDeploy.serverless.cli.log.restore();
      aliyunDeploy.provider.uploadObject.restore();
    });

    it('should upload corresponding objects to deployment bucket', () => {
      uploadObjectStub.returns(BbPromise.resolve());
      return aliyunDeploy
      .uploadArtifacts().then(() => {
        expect(uploadObjectStub.calledWithExactly(
          'serverless/my-service/dev/1499930388523-2017-07-13T07:19:48.523Z/my-service.zip',
          '/project/.serverless/my-service.zip'
          )).toEqual(true);
        const logs = [
          'Uploading serverless/my-service/dev/1499930388523-2017-07-13T07:19:48.523Z/my-service.zip to OSS bucket sls-my-service...',
          'Uploaded serverless/my-service/dev/1499930388523-2017-07-13T07:19:48.523Z/my-service.zip to OSS bucket sls-my-service'
        ];
        expect(consoleLogStub.callCount).toEqual(logs.length);
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.calledWithExactly(logs[i])).toEqual(true);
        }
      });
    });
  });
});
