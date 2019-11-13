/*global beforeEach, afterEach, expect*/

'use strict';

const sinon = require('sinon');
const path = require('path');

const AliyunProvider = require('../../provider/aliyunProvider');
const AliyunRemove = require('../aliyunRemove');
const Serverless = require('../../test/serverless');
const { role, fullRole } = require('../../test/data');

describe('removeLogProject', () => {
  let serverless;
  let aliyunRemove;
  const projectName = 'sls-accountid-cn-shanghai-logs';
  const logStoreName = 'my-service-dev';
  beforeEach(() => {
    serverless = new Serverless();
    serverless.service.service = 'my-service';
    serverless.service.provider = {
      name: 'aliyun',
      credentials: path.join(__dirname, '..', '..', 'test', 'credentials')
    };
    serverless.config = {
      servicePath: path.join(__dirname, '..', '..', 'test')
    };
  });

  describe('#removeRoleAndPolicies()', () => {
    let consoleLogStub;

    let getLogStoreStub;
    let getLogProjectStub;
    let deleteLogIndexStub;
    let deleteLogStoreStub;
    let deleteLogProjectStub;

    beforeEach(() => {
      const options = {
        stage: 'dev',
        region: 'cn-shanghai',
        'remove-logstore': true
      };
      serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
      serverless.pluginManager.setCliOptions(options);
      aliyunRemove = new AliyunRemove(serverless, options);
      aliyunRemove.templates = {
        create: require(path.join(__dirname, '..', '..', 'test', '.serverless', 'configuration-template-create.json')),
        update: require(path.join(__dirname, '..', '..', 'test', '.serverless', 'configuration-template-update.json')),
      };
      consoleLogStub = sinon.stub(aliyunRemove.serverless.cli, 'log').returns();

      getLogStoreStub = sinon.stub(aliyunRemove.provider, 'getLogStore');
      getLogProjectStub = sinon.stub(aliyunRemove.provider, 'getLogProject');
      deleteLogIndexStub = sinon.stub(aliyunRemove.provider, 'deleteLogIndex');
      deleteLogStoreStub = sinon.stub(aliyunRemove.provider, 'deleteLogStore');
      deleteLogProjectStub = sinon.stub(aliyunRemove.provider, 'deleteLogProject');
    });

    afterEach(() => {
      aliyunRemove.serverless.cli.log.restore();
      aliyunRemove.provider.getLogStore.restore();
      aliyunRemove.provider.getLogProject.restore();
      aliyunRemove.provider.deleteLogIndex.restore();
      aliyunRemove.provider.deleteLogStore.restore();
      aliyunRemove.provider.deleteLogProject.restore();
    });

    it('should remove existing log project', () => {
      getLogProjectStub.returns(Promise.resolve({}));
      getLogStoreStub.returns(Promise.resolve({}));
      deleteLogProjectStub.returns(Promise.resolve());
      deleteLogStoreStub.returns(Promise.resolve());
      deleteLogIndexStub.returns(Promise.resolve());

      return aliyunRemove.removeLogProject(projectName, logStoreName).then(() => {
        expect(getLogProjectStub.calledWithExactly(projectName)).toEqual(true);
        expect(deleteLogProjectStub.calledAfter(deleteLogStoreStub)).toEqual(true);
        expect(deleteLogStoreStub.calledAfter(deleteLogIndexStub)).toEqual(true);

        const logs = [
          'Removing index from log project sls-accountid-cn-shanghai-logs log store my-service-dev...',
          'Removed index from log project sls-accountid-cn-shanghai-logs log store my-service-dev',
          'Removing log store from log project sls-accountid-cn-shanghai-logs...',
          'Removed log store from log project sls-accountid-cn-shanghai-logs',
          'Removing log project sls-accountid-cn-shanghai-logs...',
          'Removed log project sls-accountid-cn-shanghai-logs',
        ];
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
        }
      });
    });

    it('should skip non-existing log project', () => {
      getLogProjectStub.returns(Promise.resolve(undefined));
      getLogStoreStub.returns(Promise.resolve({}));
      deleteLogProjectStub.returns(Promise.resolve());
      deleteLogStoreStub.returns(Promise.resolve());
      deleteLogIndexStub.returns(Promise.resolve());

      return aliyunRemove.removeLogProject(projectName, logStoreName).then(() => {
        expect(getLogProjectStub.calledWithExactly(projectName)).toEqual(true);
        expect(getLogStoreStub.called).toEqual(false);
        expect(deleteLogProjectStub.called).toEqual(false);
        expect(deleteLogStoreStub.called).toEqual(false);
        expect(deleteLogIndexStub.called).toEqual(false);

        const logs = [
          'No log project to remove'
        ];
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
        }
      });
    });


    it('should skip non-existing log store', () => {
      getLogProjectStub.returns(Promise.resolve({}));
      getLogStoreStub.returns(Promise.resolve(undefined));
      deleteLogProjectStub.returns(Promise.resolve());
      deleteLogStoreStub.returns(Promise.resolve());
      deleteLogIndexStub.returns(Promise.resolve());

      return aliyunRemove.removeLogProject(projectName, logStoreName).then(() => {
        expect(getLogProjectStub.calledWithExactly(projectName)).toEqual(true);
        expect(getLogStoreStub.calledWithExactly(projectName, logStoreName)).toEqual(true);
        expect(deleteLogProjectStub.called).toEqual(true);
        expect(deleteLogStoreStub.called).toEqual(false);
        expect(deleteLogIndexStub.called).toEqual(false);

        const logs = [
          'No log store to remove',
          'Removing log project sls-accountid-cn-shanghai-logs...',
          'Removed log project sls-accountid-cn-shanghai-logs'
        ];
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
        }
      });
    });
  });

  describe('#removeRoleAndPolicies()', () => {
    let consoleLogStub;
    let getLogStoreStub;
    let getLogProjectStub;
    let deleteLogIndexStub;
    let deleteLogStoreStub;
    let deleteLogProjectStub;

    beforeEach(() => {
      const options = {
        stage: 'dev',
        region: 'cn-shanghai'
      };
      serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
      serverless.pluginManager.setCliOptions(options);
      aliyunRemove = new AliyunRemove(serverless, options);
      aliyunRemove.templates = {
        create: require(path.join(__dirname, '..', '..', 'test', '.serverless', 'configuration-template-create.json')),
        update: require(path.join(__dirname, '..', '..', 'test', '.serverless', 'configuration-template-update.json')),
      };
      consoleLogStub = sinon.stub(aliyunRemove.serverless.cli, 'log').returns();

      getLogStoreStub = sinon.stub(aliyunRemove.provider, 'getLogStore');
      getLogProjectStub = sinon.stub(aliyunRemove.provider, 'getLogProject');
      deleteLogIndexStub = sinon.stub(aliyunRemove.provider, 'deleteLogIndex');
      deleteLogStoreStub = sinon.stub(aliyunRemove.provider, 'deleteLogStore');
      deleteLogProjectStub = sinon.stub(aliyunRemove.provider, 'deleteLogProject');

    });

    afterEach(() => {
      aliyunRemove.serverless.cli.log.restore();
      aliyunRemove.provider.getLogStore.restore();
      aliyunRemove.provider.getLogProject.restore();
      aliyunRemove.provider.deleteLogIndex.restore();
      aliyunRemove.provider.deleteLogStore.restore();
      aliyunRemove.provider.deleteLogProject.restore();
    });

    it('should not do anything if there is no --remove-logstore', () => {
      getLogProjectStub.returns(Promise.resolve({}));
      getLogStoreStub.returns(Promise.resolve({}));
      deleteLogProjectStub.returns(Promise.resolve());
      deleteLogStoreStub.returns(Promise.resolve());
      deleteLogIndexStub.returns(Promise.resolve());

      return aliyunRemove.removeLogProject(projectName, logStoreName).then(() => {
        expect(getLogProjectStub.called).toEqual(false);
        expect(getLogStoreStub.called).toEqual(false);
        expect(deleteLogProjectStub.called).toEqual(false);
        expect(deleteLogStoreStub.called).toEqual(false);
        expect(deleteLogIndexStub.called).toEqual(false);

        const logs = [
          'Skip removing log project'
        ];
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
        }
      });
    });
  });
});
