'use strict';

const path = require('path');

const sinon = require('sinon');
const fse = require('fs-extra');

const AliyunProvider = require('../../provider/aliyunProvider');
const AliyunPackage = require('../aliyunPackage');
const Serverless = require('../../test/serverless');

describe('CleanupServerlessDir', () => {
  let serverless;
  let aliyunPackage;
  let pathExistsSyncStub;
  let removeSyncStub;

  beforeEach(() => {
    serverless = new Serverless();
    serverless.service.service = 'my-service';
    serverless.config = {
      servicePath: false,
    };
    const options = {
      stage: 'dev',
      region: 'cn-hangzhou',
    };
    serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
    aliyunPackage = new AliyunPackage(serverless, options);
    pathExistsSyncStub = sinon.stub(fse, 'pathExistsSync');
    removeSyncStub = sinon.stub(fse, 'removeSync').returns();
  });

  afterEach(() => {
    fse.pathExistsSync.restore();
    fse.removeSync.restore();
  });

  describe('#cleanupServerlessDir()', () => {
    it('should resolve if no servicePath is given', () => {
      aliyunPackage.serverless.config.servicePath = false;

      pathExistsSyncStub.returns();

      return aliyunPackage.cleanupServerlessDir().then(() => {
        expect(pathExistsSyncStub.calledOnce).toEqual(false);
        expect(removeSyncStub.calledOnce).toEqual(false);
      });
    });

    it('should remove the .serverless directory if it exists', () => {
      const serviceName = aliyunPackage.serverless.service.service;
      aliyunPackage.serverless.config.servicePath = serviceName;
      const serverlessDirPath = path.join(serviceName, '.serverless');

      pathExistsSyncStub.returns(true);

      return aliyunPackage.cleanupServerlessDir().then(() => {
        expect(pathExistsSyncStub.calledWithExactly(serverlessDirPath)).toEqual(true);
        expect(removeSyncStub.calledWithExactly(serverlessDirPath)).toEqual(true);
      });
    });

    it('should not remove the .serverless directory if does not exist', () => {
      const serviceName = aliyunPackage.serverless.service.service;
      aliyunPackage.serverless.config.servicePath = serviceName;
      const serverlessDirPath = path.join(serviceName, '.serverless');

      pathExistsSyncStub.returns(false);

      return aliyunPackage.cleanupServerlessDir().then(() => {
        expect(pathExistsSyncStub.calledWithExactly(serverlessDirPath)).toEqual(true);
        expect(removeSyncStub.calledWithExactly(serverlessDirPath)).toEqual(false);
      });
    });
  });
});
