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
      region: 'cn-hangzhou',
    };
    serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
    aliyunDeploy = new AliyunDeploy(serverless, options);
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

  describe('#checkForExistingService()', () => {
    let getServiceStub;

    beforeEach(() => {
      getServiceStub = sinon.stub(aliyunDeploy.provider, 'getService');
    });

    afterEach(() => {
      aliyunDeploy.provider.getService.restore();
    });

    it('should return "undefined" if no existing services are found', () => {
      getServiceStub.returns(BbPromise.resolve(undefined));

      return aliyunDeploy.checkForExistingService().then((foundService) => {
        expect(foundService).toEqual(undefined);
        expect(getServiceStub
          .calledWithExactly('my-service-dev')).toEqual(true);
      });
    });
    
    it('should return service if an existing service is found', () => {
      const service = {
        serviceId: new Date().getTime().toString(16)
      };

      getServiceStub.returns(BbPromise.resolve(service));

      return aliyunDeploy.checkForExistingService().then((foundService) => {
        expect(foundService).toEqual(service);
        expect(getServiceStub
          .calledWithExactly('my-service-dev')).toEqual(true);
      });
    });
  });

  describe('#createServiceIfNotExists()', () => {
    let consoleLogStub;
    let createServiceStub;

    beforeEach(() => {
      consoleLogStub = sinon.stub(aliyunDeploy.serverless.cli, 'log').returns();
      createServiceStub = sinon.stub(aliyunDeploy.provider, 'createService');
    });

    afterEach(() => {
      aliyunDeploy.serverless.cli.log.restore();
      aliyunDeploy.provider.createService.restore();
    });

    it('should resolve if there is a existing service', () => {
      const serviceId = new Date().getTime().toString(16);
      createServiceStub.returns(BbPromise.resolve());

      return aliyunDeploy.createServiceIfNotExists({
        serviceId: serviceId
      }).then(() => {
        expect(consoleLogStub.calledOnce).toEqual(true);
        expect(aliyunDeploy.templates.create.Resources['sls-function-service'].Properties.id).toEqual(serviceId);
        expect(aliyunDeploy.templates.update.Resources['sls-function-service'].Properties.id).toEqual(serviceId);
      });
    });

    it('should create a service if there are no existing services', () => {
      const serviceId = new Date().getTime().toString(16);
      createServiceStub.returns(BbPromise.resolve({
        serviceId: serviceId
      }));
      return aliyunDeploy.createServiceIfNotExists(undefined).then(() => {
        expect(consoleLogStub.calledTwice).toEqual(true);
        expect(createServiceStub.calledWithExactly('my-service-dev')).toEqual(true);
        expect(aliyunDeploy.templates.create.Resources[aliyunDeploy.provider.getServiceId()].Properties.id).toEqual(serviceId);
        expect(aliyunDeploy.templates.update.Resources[aliyunDeploy.provider.getServiceId()].Properties.id).toEqual(serviceId);
      });
    });
  });

  describe('#createBucketIfNotExists()', () => {
    let consoleLogStub;
    let createBucketStub;
    let resetOssClientStub;

    beforeEach(() => {
      consoleLogStub = sinon.stub(aliyunDeploy.serverless.cli, 'log').returns();
      createBucketStub = sinon.stub(aliyunDeploy.provider, 'createBucket');
      resetOssClientStub = sinon.stub(aliyunDeploy.provider, 'resetOssClient');
    });

    afterEach(() => {
      aliyunDeploy.serverless.cli.log.restore();
      aliyunDeploy.provider.createBucket.restore();
      aliyunDeploy.provider.resetOssClient.restore();
    });

    it('should resolve if there is a existing bucket', () => {
      const err = new Error();
      err.name = 'BucketAlreadyExistsError';
      createBucketStub.returns(BbPromise.reject(err))
      return aliyunDeploy.createBucketIfNotExists().then(() => {
        expect(consoleLogStub.calledOnce).toEqual(true);
        expect(resetOssClientStub.calledWithExactly('sls-my-service')).toEqual(true);
      });
    });

    it('should create a bucket if there are no existing buckets', () => {
      createBucketStub.returns(BbPromise.resolve());
      return aliyunDeploy.createBucketIfNotExists().then(() => {
        expect(consoleLogStub.calledOnce).toEqual(true);
        expect(resetOssClientStub.calledWithExactly('sls-my-service')).toEqual(true);
      });
    });
  });
});
