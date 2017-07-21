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
    aliyunDeploy.provider.resetOssClient('test-bucket');
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
        expect(consoleLogStub.calledTwice).toEqual(true);
        expect(consoleLogStub.calledWithExactly('Uploaded serverless/my-service/dev/1499930388523-2017-07-13T07:19:48.523Z/my-service.zip')).toEqual(true);
        expect(uploadObjectStub.calledWithExactly(
          'serverless/my-service/dev/1499930388523-2017-07-13T07:19:48.523Z/my-service.zip',
          '/project/.serverless/my-service.zip'
          )).toEqual(true);
      });
    });
  });
});
