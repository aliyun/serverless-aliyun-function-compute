/*global beforeEach, afterEach, expect*/

'use strict';

const sinon = require('sinon');
const path = require('path');

const AliyunProvider = require('../../provider/aliyunProvider');
const AliyunRemove = require('../aliyunRemove');
const Serverless = require('../../test/serverless');
const { bucket, objects } = require('../../test/data');

describe('removeArtifacts', () => {
  let serverless;
  let aliyunRemove;

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
    const options = {
      stage: 'dev',
      region: 'cn-shanghai',
    };
    serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
    serverless.pluginManager.setCliOptions(options);
    aliyunRemove = new AliyunRemove(serverless, options);
  });

  describe('#removeArtifacts()', () => {
    let consoleLogStub;
    let getBucketStub;
    let getObjectsStub;
    let deleteObjectsStub;
    let deleteBucketStub;

    beforeEach(() => {
      aliyunRemove.serverless.service.functions = {};
      consoleLogStub = sinon.stub(aliyunRemove.serverless.cli, 'log').returns();
      getBucketStub = sinon.stub(aliyunRemove.provider, 'getBucket');
      getObjectsStub = sinon.stub(aliyunRemove.provider, 'getObjects');
      deleteObjectsStub = sinon.stub(aliyunRemove.provider, 'deleteObjects');
      deleteBucketStub = sinon.stub(aliyunRemove.provider, 'deleteBucket');
    });

    afterEach(() => {
      aliyunRemove.serverless.cli.log.restore();
      aliyunRemove.provider.getBucket.restore();
      aliyunRemove.provider.getObjects.restore();
      aliyunRemove.provider.deleteObjects.restore();
      aliyunRemove.provider.deleteBucket.restore();
    });

    it('should remove existing bucket and objects', () => {
      getBucketStub.returns(Promise.resolve(bucket));
      getObjectsStub.returns(Promise.resolve(objects));
      deleteObjectsStub.returns(Promise.resolve());
      deleteBucketStub.returns(Promise.resolve());

      return aliyunRemove.removeArtifacts().then(() => {
        expect(getBucketStub.calledOnce).toEqual(true);
        expect(getBucketStub.calledWithExactly('sls-my-service')).toEqual(true);

        expect(getObjectsStub.calledAfter(getBucketStub)).toEqual(true);
        expect(getObjectsStub.calledOnce).toEqual(true);
        expect(getObjectsStub.calledWithExactly({
          prefix: 'serverless/my-service/dev'
        })).toEqual(true);

        expect(deleteObjectsStub.calledAfter(getObjectsStub)).toEqual(true);
        expect(deleteObjectsStub.calledOnce).toEqual(true);
        expect(deleteObjectsStub.calledWithExactly(objects.map((i) => i.name))).toEqual(true);

        expect(deleteBucketStub.calledAfter(deleteObjectsStub)).toEqual(true);
        expect(deleteBucketStub.calledOnce).toEqual(true);
        expect(deleteBucketStub.calledWithExactly('sls-my-service')).toEqual(true);

        const logs = [
          'Removing 3 artifacts in OSS bucket sls-my-service...',
          'Removed 3 artifacts in OSS bucket sls-my-service',
          'Removing OSS bucket sls-my-service...',
          'Removed OSS bucket sls-my-service'
        ];
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
        }
      });
    });

    it('should only remove existing objects', () => {
      getBucketStub.returns(Promise.resolve(bucket));
      getObjectsStub.returns(Promise.resolve([objects[0]]));
      deleteObjectsStub.returns(Promise.resolve());
      deleteBucketStub.returns(Promise.resolve());

      return aliyunRemove.removeArtifacts().then(() => {
        expect(deleteObjectsStub.calledOnce).toEqual(true);
        expect(deleteObjectsStub.calledWithExactly([objects[0].name])).toEqual(true);

        expect(deleteBucketStub.calledAfter(deleteObjectsStub)).toEqual(true);
        expect(deleteBucketStub.calledOnce).toEqual(true);
        expect(deleteBucketStub.calledWithExactly('sls-my-service')).toEqual(true);

        const logs = [
          'Removing 1 artifacts in OSS bucket sls-my-service...',
          'Removed 1 artifacts in OSS bucket sls-my-service',
          'Removing OSS bucket sls-my-service...',
          'Removed OSS bucket sls-my-service'
        ];
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
        }
      });
    });

    it('should not remove any objects if there is none', () => {
      getBucketStub.returns(Promise.resolve(bucket));
      getObjectsStub.returns(Promise.resolve([]));
      deleteObjectsStub.returns(Promise.resolve());
      deleteBucketStub.returns(Promise.resolve());

      return aliyunRemove.removeArtifacts().then(() => {
        expect(deleteObjectsStub.called).toEqual(false);

        expect(deleteBucketStub.calledOnce).toEqual(true);
        expect(deleteBucketStub.calledWithExactly('sls-my-service')).toEqual(true);

        const logs = [
          'No artifacts to remove.',
          'Removing OSS bucket sls-my-service...',
          'Removed OSS bucket sls-my-service'
        ];
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
        }
      });
    });

    it('should not remove the bucket if there is not any', () => {
      getBucketStub.returns(Promise.resolve(undefined));
      getObjectsStub.returns(Promise.resolve([]));
      deleteObjectsStub.returns(Promise.resolve());
      deleteBucketStub.returns(Promise.resolve());

      return aliyunRemove.removeArtifacts().then(() => {
        expect(deleteObjectsStub.called).toEqual(false);
        expect(deleteBucketStub.called).toEqual(false);
        const logs = [
          'No artifacts to remove.',
          'No buckets to remove.'
        ];
        for (var i = 0; i < consoleLogStub.callCount; ++i) {
          expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
        }
      });
    });
  });
});
