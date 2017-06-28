'use strict';

const sinon = require('sinon');
const BbPromise = require('bluebird');

const validate = require('./validate');
const AliyunProvider = require('../provider/aliyunProvider');
const Serverless = require('../test/serverless');
const AliyunCommand = require('../test/aliyunCommand');

describe('Validate', () => {
  let serverless;
  let aliyunCommand;

  beforeEach(() => {
    serverless = new Serverless();
    serverless.config = {
      servicePath: true,
    };
    serverless.service = {
      service: 'some-default-service',
    };
    serverless.setProvider('aliyun', new AliyunProvider(serverless));
    aliyunCommand = new AliyunCommand(serverless, {}, validate);
  });

  describe('#validate()', () => {
    let validateServicePathStub;
    let validateServiceNameStub;
    let validateHandlersStub;

    beforeEach(() => {
      validateServicePathStub = sinon.stub(aliyunCommand, 'validateServicePath')
        .returns(BbPromise.resolve());
      validateServiceNameStub = sinon.stub(aliyunCommand, 'validateServiceName')
        .returns(BbPromise.resolve());
      validateHandlersStub = sinon.stub(aliyunCommand, 'validateHandlers')
        .returns(BbPromise.resolve());
    });

    afterEach(() => {
      aliyunCommand.validateServicePath.restore();
      aliyunCommand.validateServiceName.restore();
      aliyunCommand.validateHandlers.restore();
    });

    it('should run promise chain', () => aliyunCommand
      .validate().then(() => {
        expect(validateServicePathStub.calledOnce).toEqual(true);
        expect(validateServiceNameStub.calledAfter(validateServicePathStub));
        expect(validateHandlersStub.calledAfter(validateServiceNameStub));
      }));
  });

  describe('#validateServicePath()', () => {
    it('should throw an error if not inside service', () => {
      serverless.config.servicePath = false;

      expect(() => aliyunCommand.validateServicePath()).toThrow(Error);
    });

    it('should not throw an error if inside service', () => {
      serverless.config.servicePath = true;

      expect(() => aliyunCommand.validateServicePath()).not.toThrow(Error);
    });
  });

  describe('#validateServiceName()', () => {
    it('should throw an error if the service name contains an invalid cahracter', () => {
      serverless.service.service = 'service name';

      expect(() => aliyunCommand.validateServiceName()).toThrow(Error);
    });

    it('should throw an error if the service name is too long', () => {
      serverless.service.service = 's'.repeat(130);

      expect(() => aliyunCommand.validateServiceName()).toThrow(Error);
    });

    it('should not throw an error if the service name is valid', () => {
      serverless.service.service = 'service-name';

      expect(() => aliyunCommand.validateServiceName()).not.toThrow(Error);
    });
  });

  describe('#validateHandlers()', () => {
    it('should throw an error if the handler name is invalid', () => {
      aliyunCommand.serverless.service.functions = {
        foo: {
          handler: '.invalid.handler',
        },
        bar: {
          handler: 'invalid.handler.',
        },
      };

      expect(() => aliyunCommand.validateHandlers()).toThrow(Error);
    });

    it('should not throw an error if the function handler is valid', () => {
      aliyunCommand.serverless.service.functions = {
        foo: {
          handler: 'valid.handler',
        },
        bar: {
          handler: 'src/valid_file.handler-test',
        },
      };

      expect(() => aliyunCommand.validateHandlers()).not.toThrow(Error);
    });
  });
});
