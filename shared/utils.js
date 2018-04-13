'use strict';

const _ = require('lodash');

module.exports = {
  setDefaults() {
    this.options.stage = _.get(this, 'options.stage')
      || 'dev';
    this.options.region = _.get(this, 'options.region')
      || 'cn-shanghai';

    return Promise.resolve();
  },
};
