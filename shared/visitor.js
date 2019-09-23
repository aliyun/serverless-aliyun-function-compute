'use strict';

const pkg = require('../package.json');
const uuid = require('uuid');
const ua = require('universal-analytics');
const ci = require('ci-info');
const osName = require('os-name');
const Conf = require('conf');
const detectMocha = require('detect-mocha');

const os = osName();
const packageName = pkg.name;
const nodeVersion = process.version;
const appVersion = pkg.version;

const conf = new Conf({
  configName: `ga-${packageName}`,
  projectName: packageName,
  defaults: {
    cid: uuid.v4()
  }
});

var fake = {
  pageview: () => {
    return {
      send: () => { return 'fake'; }
    };
  },
  event: () => {
    return {
      send: () => { return 'fake'; }
    };
  }
};

var fakeMocha = {
  pageview: () => {
    return {
      send: () => { return 'fakeMocha'; }
    };
  },
  event: () => {
    return {
      send: () => { return 'fakeMocha'; }
    };
  }
};

var real = ua('UA-148336517-1', conf.get('cid'));

real.set('cd1', os);
real.set('cd2', nodeVersion);
real.set('cd3', appVersion);

let visitor;

function getVisitor() {

  if (!visitor) {

    if (detectMocha()) {
      return fakeMocha;
    }

    if (ci.isCI) {
      real.pageview(`/downloaded/ci/${ci.name}`).send();
      return fake;
    }

    visitor = real;
  }

  return visitor;
}

function visitorWrap(category) {
  const visitor = getVisitor();
  return ((category) => {
    return (action, func) => {
      return async () => {
        try {
          visitor.pageview(`/${category}`).send();
          const result = await func();
          visitor.event({
            ec: category,
            ea: action,
            el: 'success',
            dp: `/${category}`
          }).send();
          return result;
        } catch (e) {
          visitor.event({
            ec: category,
            ea: action,
            el: 'error',
            dp: `/${category}`
          }).send();
          throw e;
        }
      };
    };
  })(category);
}

function hooksWrap(hooks, category) {
  const wrap = visitorWrap(category);
  const reducer = (acc, hookEvt) => {
    acc[hookEvt] =  wrap(hookEvt, hooks[hookEvt]);
    return acc;
  };
  return Object.keys(hooks).reduce(reducer, {});
}

module.exports = { getVisitor, visitorWrap, hooksWrap };
