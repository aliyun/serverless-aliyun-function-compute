'use strict';

const fs = require('fs');
const path = require('path');

const sinon = require('sinon');
const BbPromise = require('bluebird');

const AliyunProvider = require('../../provider/aliyunProvider');
const AliyunDeploy = require('../aliyunDeploy');
const Serverless = require('../../test/serverless');

describe('UpdateDeployment', () => {
  let serverless;
  let aliyunDeploy;
  let requestStub;
  let configurationTemplateUpdateFilePath;

  beforeEach(() => {
    serverless = new Serverless();
    serverless.service.service = 'my-service';
    serverless.service.provider = {
      project: 'my-project',
    };
    serverless.config = {
      servicePath: 'tmp',
    };
    const options = {
      stage: 'dev',
      region: 'cn-hangzhou',
    };
    serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
    aliyunDeploy = new AliyunDeploy(serverless, options);
    requestStub = sinon.stub(aliyunDeploy.provider, 'request');
    configurationTemplateUpdateFilePath = path.join(
      serverless.config.servicePath,
      '.serverless',
      'configuration-template-update.json');
  });

  afterEach(() => {
    aliyunDeploy.provider.request.restore();
  });

  describe('#updateDeployment()', () => {
    let getDeploymentStub;
    let updateStub;

    beforeEach(() => {
      getDeploymentStub = sinon.stub(aliyunDeploy, 'getDeployment')
        .returns(BbPromise.resolve());
      updateStub = sinon.stub(aliyunDeploy, 'update')
        .returns(BbPromise.resolve());
    });

    afterEach(() => {
      aliyunDeploy.getDeployment.restore();
      aliyunDeploy.update.restore();
    });

    it('should run promise chain', () => aliyunDeploy
      .updateDeployment().then(() => {
        expect(getDeploymentStub.calledOnce).toEqual(true);
        expect(updateStub.calledAfter(getDeploymentStub));
      }),
    );
  });

  describe('#getDeployment()', () => {
    it('should return undefined if no deployments are found', () => {
      const response = {
        deployments: [
          { name: 'some-other-deployment' },
        ],
      };
      requestStub.returns(BbPromise.resolve(response));

      return aliyunDeploy.getDeployment().then((foundDeployment) => {
        expect(foundDeployment).toEqual(undefined);
        expect(requestStub.calledWithExactly(
          'deploymentmanager',
          'deployments',
          'list',
          { project: 'my-project' },
        )).toEqual(true);
      });
    });

    it('should return the deployment if found', () => {
      const response = {
        deployments: [
          { name: 'sls-my-service-dev' },
          { name: 'some-other-deployment' },
        ],
      };
      requestStub.returns(BbPromise.resolve(response));

      return aliyunDeploy.getDeployment().then((foundDeployment) => {
        expect(foundDeployment).toEqual(response.deployments[0]);
        expect(requestStub.calledWithExactly(
          'deploymentmanager',
          'deployments',
          'list',
          { project: 'my-project' },
        )).toEqual(true);
      });
    });
  });

  describe('#update()', () => {
    let consoleLogStub;
    let readFileSyncStub;
    let monitorDeploymentStub;

    beforeEach(() => {
      consoleLogStub = sinon.stub(aliyunDeploy.serverless.cli, 'log').returns();
      readFileSyncStub = sinon.stub(fs, 'readFileSync').returns('some content');
      monitorDeploymentStub = sinon.stub(aliyunDeploy, 'monitorDeployment')
        .returns(BbPromise.resolve());
    });

    afterEach(() => {
      aliyunDeploy.serverless.cli.log.restore();
      fs.readFileSync.restore();
      aliyunDeploy.monitorDeployment.restore();
    });

    it('should update and hand over to monitor the deployment if it exists', () => {
      const deployment = {
        name: 'sls-my-service-dev',
        fingerprint: '12345678',
      };
      const params = {
        project: 'my-project',
        deployment: 'sls-my-service-dev',
        resource: {
          name: 'sls-my-service-dev',
          fingerprint: deployment.fingerprint,
          target: {
            config: {
              content: fs.readFileSync(configurationTemplateUpdateFilePath).toString(),
            },
          },
        },
      };
      requestStub.returns(BbPromise.resolve());

      return aliyunDeploy.update(deployment).then(() => {
        expect(consoleLogStub.calledOnce).toEqual(true);
        expect(readFileSyncStub.called).toEqual(true);
        expect(requestStub.calledWithExactly(
          'deploymentmanager',
          'deployments',
          'update',
          params,
        )).toEqual(true);
        expect(monitorDeploymentStub.calledWithExactly(
          'sls-my-service-dev',
          'update',
          5000,
        )).toEqual(true);
      });
    });
  });
});
