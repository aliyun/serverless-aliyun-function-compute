'use strict';

const setDefaults = require('./utils');
const AliyunProvider = require('../provider/aliyunProvider');
const Serverless = require('../test/serverless');
const AliyunCommand = require('../test/aliyunCommand');

describe('Utils', () => {
  let serverless;
  let aliyunCommand;

  beforeEach(() => {
    serverless = new Serverless();
    serverless.setProvider('aliyun', new AliyunProvider(serverless, {}));
    aliyunCommand = new AliyunCommand(serverless, {}, setDefaults);
  });

  describe('#setDefaults()', () => {
    it('should set default values for options if not provided', () => aliyunCommand
      .setDefaults().then(() => {
        expect(aliyunCommand.options.stage).toEqual('dev');
        expect(aliyunCommand.options.region).toEqual('cn-shanghai');
      }));

    it('should set the options when they are provided', () => {
      aliyunCommand.options.stage = 'my-stage';
      aliyunCommand.options.region = 'my-region';

      return aliyunCommand.setDefaults().then(() => {
        expect(aliyunCommand.options.stage).toEqual('my-stage');
        expect(aliyunCommand.options.region).toEqual('my-region');
      });
    });
  });
});
