'use strict';

/* eslint no-use-before-define: 0 */

const _ = require('lodash');

module.exports = {
  mergeServiceResources() {
    const resources = this.serverless.service.resources;

    if ((typeof resources === 'undefined') || _.isEmpty(resources)) {return Promise.resolve();}

    _.mergeWith(
      this.serverless.service.provider.compiledConfigurationTemplate,
      { Resources: resources && resources.resources },
      mergeCustomizer);

    return Promise.resolve();
  },
};

const mergeCustomizer = (objValue, srcValue) => {
  if (_.isArray(objValue)) {return objValue.concat(srcValue);}
  return objValue;
};
