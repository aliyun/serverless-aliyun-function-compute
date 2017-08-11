'use strict';

const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const sinon = require('sinon');
const BbPromise = require('bluebird');

const AliyunProvider = require('../../provider/aliyunProvider');
const AliyunDeploy = require('../aliyunDeploy');
const Serverless = require('../../test/serverless');
const { service, execRole, fullExecRole, logIndex, fullLogIndex, logProject, fullLogProject, logStore, fullLogStore } = require('../../test/data');

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
    let createLogConfigIfNotExistsStub;
    let setupExecRoleStub;
    let checkForExistingServiceStub;
    let createServiceIfNotExistsStub;
    let createBucketIfNotExistsStub;

    beforeEach(() => {
      createLogConfigIfNotExistsStub = sinon.stub(aliyunDeploy, 'createLogConfigIfNotExists')
        .returns(BbPromise.resolve());
      setupExecRoleStub = sinon.stub(aliyunDeploy, 'setupExecRole')
        .returns(BbPromise.resolve());
      checkForExistingServiceStub = sinon.stub(aliyunDeploy, 'checkForExistingService')
        .returns(BbPromise.resolve());
      createServiceIfNotExistsStub = sinon.stub(aliyunDeploy, 'createServiceIfNotExists')
        .returns(BbPromise.resolve());
      createBucketIfNotExistsStub = sinon.stub(aliyunDeploy, 'createBucketIfNotExists')
        .returns(BbPromise.resolve());
    });

    afterEach(() => {
      aliyunDeploy.createLogConfigIfNotExists.restore();
      aliyunDeploy.setupExecRole.restore();
      aliyunDeploy.checkForExistingService.restore();
      aliyunDeploy.createServiceIfNotExists.restore();
      aliyunDeploy.createBucketIfNotExists.restore();
    });

    it('should run promise chain', () => aliyunDeploy
      .setupService().then(() => {
        expect(createLogConfigIfNotExistsStub.calledOnce).toEqual(true);
        expect(setupExecRoleStub.calledAfter(createLogConfigIfNotExistsStub)).toEqual(true);
        expect(checkForExistingServiceStub.calledAfter(setupExecRoleStub)).toEqual(true);
        expect(createServiceIfNotExistsStub.calledAfter(checkForExistingServiceStub));
        expect(createBucketIfNotExistsStub.calledAfter(createServiceIfNotExistsStub));
      }),
    );
  });

  describe('#setupService()', () => {
    let setupRoleStub;
    let getServiceStub;
    let consoleLogStub;
    let createServiceStub;
    let getBucketStub;
    let createBucketStub;
    let resetOssClientStub;
    let getLogProjectStub;
    let createLogProjectStub;
    let getLogStoreStub;
    let createLogStoreStub;
    let getLogIndexStub;
    let createLogIndexStub;

    beforeEach(() => {
      setupRoleStub = sinon.stub(aliyunDeploy, 'setupRole');
      getServiceStub = sinon.stub(aliyunDeploy.provider, 'getService');
      consoleLogStub = sinon.stub(aliyunDeploy.serverless.cli, 'log').returns();
      createServiceStub = sinon.stub(aliyunDeploy.provider, 'createService');
      getBucketStub = sinon.stub(aliyunDeploy.provider, 'getBucket');
      createBucketStub = sinon.stub(aliyunDeploy.provider, 'createBucket');
      resetOssClientStub = sinon.stub(aliyunDeploy.provider, 'resetOssClient');

      getLogProjectStub = sinon.stub(aliyunDeploy.provider, 'getLogProject');
      createLogProjectStub = sinon.stub(aliyunDeploy.provider, 'createLogProject');
      getLogStoreStub = sinon.stub(aliyunDeploy.provider, 'getLogStore');
      createLogStoreStub = sinon.stub(aliyunDeploy.provider, 'createLogStore');
      getLogIndexStub = sinon.stub(aliyunDeploy.provider, 'getLogIndex');
      createLogIndexStub = sinon.stub(aliyunDeploy.provider, 'createLogIndex');
    });

    afterEach(() => {
      aliyunDeploy.setupRole.restore();
      aliyunDeploy.provider.getService.restore();
      aliyunDeploy.serverless.cli.log.restore();
      aliyunDeploy.provider.createService.restore();
      aliyunDeploy.provider.getBucket.restore();
      aliyunDeploy.provider.createBucket.restore();
      aliyunDeploy.provider.resetOssClient.restore();

      aliyunDeploy.provider.getLogProject.restore();
      aliyunDeploy.provider.createLogProject.restore();
      aliyunDeploy.provider.getLogStore.restore();
      aliyunDeploy.provider.createLogStore.restore();
      aliyunDeploy.provider.getLogIndex.restore();
      aliyunDeploy.provider.createLogIndex.restore();
    });

    it('should set up service from scratch', () => {
      const serviceId = new Date().getTime().toString(16);
      setupRoleStub.returns(BbPromise.resolve(fullExecRole));
      getServiceStub.returns(BbPromise.resolve(undefined));
      createServiceStub.returns(BbPromise.resolve({ serviceId }));
      getBucketStub.returns(BbPromise.resolve(undefined));
      createBucketStub.returns(BbPromise.resolve());
      resetOssClientStub.returns();

      getLogProjectStub.returns(BbPromise.resolve(undefined));
      createLogProjectStub.returns(BbPromise.resolve(fullLogProject));
      getLogStoreStub.returns(BbPromise.resolve(undefined));
      createLogStoreStub.returns(BbPromise.resolve(fullLogStore));
      getLogIndexStub.returns(BbPromise.resolve(undefined));
      createLogIndexStub.returns(BbPromise.resolve(fullLogIndex));

      return aliyunDeploy.setupService().then(() => {
        expect(getLogProjectStub.calledOnce).toEqual(true);
        expect(getLogProjectStub.calledWithExactly('sls-my-service-logs')).toEqual(true);

        expect(createLogProjectStub.calledAfter(getLogProjectStub)).toEqual(true);
        expect(createLogProjectStub.calledOnce).toEqual(true);
        expect(createLogProjectStub.getCall(0).args)
          .toEqual(['sls-my-service-logs', logProject]);

        expect(getLogStoreStub.calledAfter(createLogProjectStub)).toEqual(true);
        expect(getLogStoreStub.calledOnce).toEqual(true);
        expect(getLogStoreStub.calledWithExactly('sls-my-service-logs', 'my-service-dev')).toEqual(true);

        expect(createLogStoreStub.calledAfter(getLogStoreStub)).toEqual(true);
        expect(createLogStoreStub.calledOnce).toEqual(true);
        expect(createLogStoreStub.getCall(0).args)
          .toEqual(['sls-my-service-logs', 'my-service-dev', logStore]);

        expect(getLogIndexStub.calledAfter(createLogStoreStub)).toEqual(true);
        expect(getLogIndexStub.calledOnce).toEqual(true);
        expect(getLogIndexStub.calledWithExactly('sls-my-service-logs', 'my-service-dev')).toEqual(true);

        expect(createLogIndexStub.calledAfter(getLogIndexStub)).toEqual(true);
        expect(createLogIndexStub.calledOnce).toEqual(true);
        expect(createLogIndexStub.getCall(0).args)
          .toEqual(['sls-my-service-logs', 'my-service-dev', logIndex]);

        expect(setupRoleStub.calledAfter(createLogIndexStub)).toEqual(true);
        expect(setupRoleStub.calledOnce).toEqual(true);
        expect(setupRoleStub.getCall(0).args).toEqual([execRole]);

        expect(getServiceStub.calledAfter(setupRoleStub)).toEqual(true);
        expect(getServiceStub.calledOnce).toEqual(true);
        expect(getServiceStub.calledWithExactly('my-service-dev')).toEqual(true);

        expect(createServiceStub.calledAfter(getServiceStub)).toEqual(true);
        expect(createServiceStub.calledOnce).toEqual(true);
        expect(createServiceStub.getCall(0).args).toEqual(['my-service-dev', Object.assign({
          role: fullExecRole.Arn
        }, service)]);

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
          'Creating log project sls-my-service-logs...',
          'Created log project sls-my-service-logs',
          'Creating log store sls-my-service-logs/my-service-dev...',
          'Created log store sls-my-service-logs/my-service-dev',
          'Creating log index for sls-my-service-logs/my-service-dev...',
          'Created log index for sls-my-service-logs/my-service-dev',
          'Creating service my-service-dev...',
          'Created service my-service-dev',
          'Creating bucket sls-my-service...',
          'Created bucket sls-my-service'
        ];
        expect(consoleLogStub.callCount).toEqual(logs.length);
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
        }
      });
    });

    it('should handle existing service ', () => {
      const serviceId = new Date().getTime().toString(16);
      setupRoleStub.returns(BbPromise.resolve(fullExecRole));
      getServiceStub.returns(BbPromise.resolve({ serviceId }));
      createServiceStub.returns(BbPromise.resolve({ serviceId }));
      getBucketStub.returns(BbPromise.resolve({
        name: 'sls-my-service',
        region: 'cn-shanghai'
      }));
      createBucketStub.returns(BbPromise.resolve());
      resetOssClientStub.returns();
      getLogProjectStub.returns(BbPromise.resolve(fullLogProject));
      createLogProjectStub.returns(BbPromise.resolve());
      getLogStoreStub.returns(BbPromise.resolve(fullLogStore));
      createLogStoreStub.returns(BbPromise.resolve());
      getLogIndexStub.returns(BbPromise.resolve(fullLogIndex));
      createLogIndexStub.returns(BbPromise.resolve());

      return aliyunDeploy.setupService().then(() => {
        expect(getLogProjectStub.calledOnce).toEqual(true);
        expect(getLogProjectStub.calledWithExactly('sls-my-service-logs')).toEqual(true);

        expect(createLogProjectStub.called).toEqual(false);

        expect(getLogStoreStub.calledAfter(getLogProjectStub)).toEqual(true);
        expect(getLogStoreStub.calledOnce).toEqual(true);
        expect(getLogStoreStub.calledWithExactly('sls-my-service-logs', 'my-service-dev')).toEqual(true);

        expect(createLogStoreStub.called).toEqual(false);

        expect(getLogIndexStub.calledAfter(getLogStoreStub)).toEqual(true);
        expect(getLogIndexStub.calledOnce).toEqual(true);
        expect(getLogIndexStub.calledWithExactly('sls-my-service-logs', 'my-service-dev')).toEqual(true);

        expect(createLogIndexStub.called).toEqual(false);

        expect(setupRoleStub.calledOnce).toEqual(true);
        expect(setupRoleStub.getCall(0).args).toEqual([execRole]);

        expect(getServiceStub.calledAfter(setupRoleStub)).toEqual(true);
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

        const logs = [
          'Log project sls-my-service-logs already exists.',
          'Log store sls-my-service-logs/my-service-dev already exists.',
          'Log store sls-my-service-logs/my-service-dev already has an index.',
          'Service my-service-dev already exists.',
          'Bucket sls-my-service already exists.'
        ];
        expect(consoleLogStub.callCount).toEqual(logs.length);
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
        }
      });
    });
  });
});
