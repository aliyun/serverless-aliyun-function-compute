'use strict';

const fs = require('fs');
const path = require('path');

const sinon = require('sinon');
const BbPromise = require('bluebird');

const AliyunProvider = require('../../provider/aliyunProvider');
const AliyunDeploy = require('../aliyunDeploy');
const Serverless = require('../../test/serverless');

describe('setupServices', () => {
  let serverless;
  let aliyunDeploy;
  let templatePath;

  beforeEach(() => {
    serverless = new Serverless();
    serverless.service.service = 'my-service';
    serverless.service.provider = {
      name: 'aliyun',
      credentials: path.join(__dirname, '..', '..', 'test', 'credentials'),
    };
    serverless.config = {
      servicePath: path.join(__dirname, '..', '..', 'test')
    };
    const options = {
      stage: 'dev',
      region: 'cn-shanghai',
    };
    serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
    aliyunDeploy = new AliyunDeploy(serverless, options);    aliyunDeploy.templates = {
      create: require(path.join(__dirname, '..', '..', 'test', '.serverless', 'configuration-template-create.json')),
      update: require(path.join(__dirname, '..', '..', 'test', '.serverless', 'configuration-template-update.json')),
    }
  });

  describe('#setupService()', () => {
    let checkForExistingServiceStub;
    let createServiceIfNotExistsStub;
    let createBucketIfNotExistsStub;
    let getServiceStub;

    beforeEach(() => {
      getServiceStub = sinon.stub(aliyunDeploy.provider, 'getService');
      checkForExistingServiceStub = sinon.stub(aliyunDeploy, 'checkForExistingService')
        .returns(BbPromise.resolve());
      createServiceIfNotExistsStub = sinon.stub(aliyunDeploy, 'createServiceIfNotExists')
        .returns(BbPromise.resolve());
      createBucketIfNotExistsStub = sinon.stub(aliyunDeploy, 'createBucketIfNotExists')
        .returns(BbPromise.resolve());
    });

    afterEach(() => {
      aliyunDeploy.provider.getService.restore();
      aliyunDeploy.checkForExistingService.restore();
      aliyunDeploy.createServiceIfNotExists.restore();
      aliyunDeploy.createBucketIfNotExists.restore();
    });

    it('should run promise chain', () => aliyunDeploy
      .setupService().then(() => {
        expect(checkForExistingServiceStub.calledOnce).toEqual(true);
        expect(createServiceIfNotExistsStub.calledAfter(checkForExistingServiceStub));
        expect(createBucketIfNotExistsStub.calledAfter(createServiceIfNotExistsStub));
      }),
    );
  });

  describe('#setupService()', () => {
    let getServiceStub;
    let consoleLogStub;
    let createServiceStub;
    let getBucketStub;
    let createBucketStub;
    let resetOssClientStub;

    beforeEach(() => {
      getServiceStub = sinon.stub(aliyunDeploy.provider, 'getService');
      consoleLogStub = sinon.stub(aliyunDeploy.serverless.cli, 'log').returns();
      createServiceStub = sinon.stub(aliyunDeploy.provider, 'createService');
      getBucketStub = sinon.stub(aliyunDeploy.provider, 'getBucket');
      createBucketStub = sinon.stub(aliyunDeploy.provider, 'createBucket');
      resetOssClientStub = sinon.stub(aliyunDeploy.provider, 'resetOssClient');
    });

    afterEach(() => {
      aliyunDeploy.provider.getService.restore();
      aliyunDeploy.serverless.cli.log.restore();
      aliyunDeploy.provider.createService.restore();
      aliyunDeploy.provider.getBucket.restore();
      aliyunDeploy.provider.createBucket.restore();
      aliyunDeploy.provider.resetOssClient.restore();
    });

    it('should set up service from scratch', () => {
      const serviceId = new Date().getTime().toString(16);
      getServiceStub.returns(BbPromise.resolve(undefined));
      createServiceStub.returns(BbPromise.resolve({ serviceId }));
      getBucketStub.returns(BbPromise.resolve(undefined));
      createBucketStub.returns(BbPromise.resolve());
      resetOssClientStub.returns();

      return aliyunDeploy.setupService().then(() => {
        expect(getServiceStub.calledOnce).toEqual(true);
        expect(getServiceStub.calledWithExactly('my-service-dev')).toEqual(true);

        expect(createServiceStub.calledAfter(getServiceStub)).toEqual(true);
        expect(createServiceStub.calledOnce).toEqual(true);
        expect(createServiceStub.calledWithExactly('my-service-dev')).toEqual(true);

        expect(getBucketStub.calledAfter(createServiceStub)).toEqual(true);
        expect(getBucketStub.calledOnce).toEqual(true);
        expect(getBucketStub.calledWithExactly('sls-my-service')).toEqual(true);

        expect(createBucketStub.calledAfter(getBucketStub)).toEqual(true);
        expect(createBucketStub.calledOnce).toEqual(true);
        expect(createBucketStub.calledWithExactly('sls-my-service')).toEqual(true);

        expect(resetOssClientStub.calledAfter(createBucketStub)).toEqual(true);
        expect(resetOssClientStub.calledOnce).toEqual(true);
        expect(resetOssClientStub.calledWithExactly('sls-my-service')).toEqual(true);

        const logs = [
          'Creating service my-service-dev...',
          'Created service my-service-dev',
          'Creating bucket sls-my-service...',
          'Created bucket sls-my-service'
        ];
        expect(consoleLogStub.callCount).toEqual(logs.length);
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.calledWithExactly(logs[i])).toEqual(true);
        }
      });
    });

    it('should handle existing service ', () => {
      const serviceId = new Date().getTime().toString(16);
      getServiceStub.returns(BbPromise.resolve({ serviceId }));
      createServiceStub.returns(BbPromise.resolve({ serviceId }));
      getBucketStub.returns(BbPromise.resolve({
        name: 'sls-my-service',
        region: 'cn-shanghai'
      }));
      createBucketStub.returns(BbPromise.resolve());
      resetOssClientStub.returns();

      return aliyunDeploy.setupService().then(() => {
        expect(getServiceStub.calledOnce).toEqual(true);
        expect(getServiceStub.calledWithExactly('my-service-dev')).toEqual(true);

        expect(createServiceStub.called).toEqual(false);

        expect(getBucketStub.calledAfter(getServiceStub)).toEqual(true);
        expect(getBucketStub.calledOnce).toEqual(true);
        expect(getBucketStub.calledWithExactly('sls-my-service')).toEqual(true);

        expect(createBucketStub.calledOnce).toEqual(false);

        expect(resetOssClientStub.calledAfter(getBucketStub)).toEqual(true);
        expect(resetOssClientStub.calledOnce).toEqual(true);
        expect(resetOssClientStub.calledWithExactly('sls-my-service')).toEqual(true);

        expect(consoleLogStub.calledTwice).toEqual(true);
        const logs = [
          'Service my-service-dev already exists.',
          'Bucket sls-my-service already exists.'
        ];
        expect(consoleLogStub.callCount).toEqual(logs.length);
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.calledWithExactly(logs[i])).toEqual(true);
        }
      });
    });
  });
});
