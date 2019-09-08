/*global beforeEach, expect*/

'use strict';

const fs = require('fs');
const path = require('path');

const AliyunProvider = require('../../provider/aliyunProvider');
const AliyunDeploy = require('../aliyunDeploy');
const Serverless = require('../../test/serverless');

describe('UploadArtifacts', () => {
  let serverless;
  let aliyunDeploy;
  const servicePath = path.join(__dirname, '..', '..', 'test');

  beforeEach(() => {
    serverless = new Serverless();
    serverless.service.service = 'my-service';
    serverless.service.provider = {
      name: 'aliyun',
      credentials: path.join(__dirname, '..', '..', 'test', 'credentials')
    };
    serverless.config = { servicePath };
    const options = {
      stage: 'dev',
      region: 'cn-shanghai',
    };
    serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
    aliyunDeploy = new AliyunDeploy(serverless, options);
  });

  describe('#loadTemplates()', () => {
    it('should make the templates accessible', () => {
      const create = fs.readFileSync(
        path.join(servicePath, '.serverless', 'configuration-template-create.json'), 'utf8');
      const update = fs.readFileSync(
        path.join(servicePath, '.serverless', 'configuration-template-update.json'), 'utf8');
      const templates = {
        create: JSON.parse(create),
        update: JSON.parse(update)
      };
      return aliyunDeploy.loadTemplates().then(() => {
        expect(aliyunDeploy.templates).toEqual(templates);
      });
    });
  });
});
