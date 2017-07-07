'use strict';

const fs = require('fs');

const sinon = require('sinon');
const BbPromise = require('bluebird');

const AliyunProvider = require('../../provider/aliyunProvider');
const AliyunDeploy = require('../aliyunDeploy');
const Serverless = require('../../test/serverless');

describe('UploadArtifacts', () => {
  let serverless;
  let aliyunDeploy;
  let consoleLogStub;
  let requestStub;
  let createReadStreamStub;

  beforeEach(() => {
    serverless = new Serverless();
    serverless.service = {
      service: 'my-service',
      provider: {
        deploymentBucketName: 'sls-my-service-dev-12345678',
      },
      package: {
        artifactFilePath: '/some-file-path',
        artifact: 'artifact.zip',
      },
    };
    const options = {
      stage: 'dev',
      region: 'cn-hangzhou',
    };
    serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
    aliyunDeploy = new AliyunDeploy(serverless, options);
    consoleLogStub = sinon.stub(aliyunDeploy.serverless.cli, 'log').returns();
    requestStub = sinon.stub(aliyunDeploy.provider, 'request').returns(BbPromise.resolve());
    createReadStreamStub = sinon.stub(fs, 'createReadStream').returns();
  });

  afterEach(() => {
    aliyunDeploy.serverless.cli.log.restore();
    aliyunDeploy.provider.request.restore();
    fs.createReadStream.restore();
  });

  describe('#uploadArtifacts()', () => {
    it('should upload corresponding objects to deployment bucket', () => aliyunDeploy
      .uploadArtifacts().then(() => {
        expect(requestStub.calledWithExactly(
          'storage',
          'objects',
          'insert',
          {
            bucket: 'sls-my-service-dev-12345678',
            resource: {
              name: '/some-file-path',
              contentType: 'application/octet-stream',
            },
            media: {
              mimeType: 'application/octet-stream',
              body: fs.createReadStream('artifact.zip'),
            },
          })).toEqual(true);
      }));

    it('should log info messages', () => aliyunDeploy
      .uploadArtifacts().then(() => {
        expect(consoleLogStub.called).toEqual(true);
        expect(requestStub.calledWithExactly(
          'storage',
          'objects',
          'insert',
          {
            bucket: 'sls-my-service-dev-12345678',
            resource: {
              name: '/some-file-path',
              contentType: 'application/octet-stream',
            },
            media: {
              mimeType: 'application/octet-stream',
              body: fs.createReadStream('artifact.zip'),
            },
          })).toEqual(true);
      }));

    it('should read artifact file as read stream', () => aliyunDeploy
      .uploadArtifacts().then(() => {
        expect(createReadStreamStub.calledOnce).toEqual(true);
        expect(requestStub.calledWithExactly(
          'storage',
          'objects',
          'insert',
          {
            bucket: 'sls-my-service-dev-12345678',
            resource: {
              name: '/some-file-path',
              contentType: 'application/octet-stream',
            },
            media: {
              mimeType: 'application/octet-stream',
              body: fs.createReadStream('artifact.zip'),
            },
          })).toEqual(true);
      }));
  });
});
