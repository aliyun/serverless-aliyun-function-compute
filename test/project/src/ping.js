'use strict';

module.exports = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      event: JSON.parse(event.toString()),
      context: context
    })
  };

  callback(null, response);
};
