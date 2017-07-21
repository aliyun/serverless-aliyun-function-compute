'use strict';

const moment = require('moment');

module.exports = (event, context, callback) => {
  const time = moment().format('YYYY-MM-DD:HH:mm:ss');
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: `Hello, the current time is ${time}.`,
    }),
  };

  callback(null, response);
};
