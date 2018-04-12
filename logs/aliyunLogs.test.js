/*global beforeEach, afterEach, expect*/

'use strict';

const sinon = require('sinon');
const BbPromise = require('bluebird');

const AliyunProvider = require('../provider/aliyunProvider');
const AliyunLogs = require('./aliyunLogs');
const Serverless = require('../test/serverless');

describe('AliyunLogs', () => {
  let serverless;
  let options;
  let aliyunLogs;

  beforeEach(() => {
    serverless = new Serverless();
    options = {
      stage: 'my-stage',
      region: 'my-region',
      function: 'postTest'
    };
    serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
    serverless.pluginManager.setCliOptions(options);
    aliyunLogs = new AliyunLogs(serverless, options);
  });

  describe('#constructor()', () => {
    it('should set the serverless instance', () => {
      expect(aliyunLogs.serverless).toEqual(serverless);
    });

    it('should set options if provided', () => {
      expect(aliyunLogs.options).toEqual(options);
    });

    it('should make the provider accessible', () => {
      expect(aliyunLogs.provider).toBeInstanceOf(AliyunProvider);
    });

    describe('hooks', () => {
      let validateStub;
      let setDefaultsStub;
      let retrieveLogsStub;

      beforeEach(() => {
        validateStub = sinon.stub(aliyunLogs, 'validate')
          .returns(BbPromise.resolve());
        setDefaultsStub = sinon.stub(aliyunLogs, 'setDefaults')
          .returns(BbPromise.resolve());
        retrieveLogsStub = sinon.stub(aliyunLogs, 'retrieveLogs')
          .returns(BbPromise.resolve());
      });

      afterEach(() => {
        aliyunLogs.validate.restore();
        aliyunLogs.setDefaults.restore();
        aliyunLogs.retrieveLogs.restore();
      });

      it('should run "before:logs:logs" promise chain', () => aliyunLogs
        .hooks['before:logs:logs']().then(() => {
          expect(validateStub.calledOnce).toEqual(true);
          expect(setDefaultsStub.calledAfter(validateStub)).toEqual(true);
        }));

      it('should run "logs:logs" promise chain', () => aliyunLogs
        .hooks['logs:logs']().then(() => {
          expect(retrieveLogsStub.calledOnce).toEqual(true);
        }));
    });
  });
});
