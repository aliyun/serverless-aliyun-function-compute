'use strict';

const oss = require('ali-oss').Wrapper;

module.exports = (event, context, callback) => {
  const parsedEvent = JSON.parse(event);
  const ossEvent = parsedEvent.events[0];
  // Required by OSS sdk: OSS region is prefixed with "oss-", e.g. "oss-cn-shanghai"
  const ossRegion = `oss-${ossEvent.region}`;
  // Create oss client.
  const client = new oss({
    region: ossRegion,
    bucket: ossEvent.oss.bucket.name,
    // Credentials can be retrieved from context
    accessKeyId: context.credentials.accessKeyId,
    accessKeySecret: context.credentials.accessKeySecret,
    stsToken: context.credentials.securityToken
  });

  const objKey = ossEvent.oss.object.key;
  console.log('Getting object: ', objKey);
  client.get(objKey).then(function(val) {
    const newKey = objKey.replace('source/', 'processed/');
    return client.put(newKey, val.content).then(function (val) {
      console.log('Put object:', val);
      callback(null, val);
    }).catch(function (err) {
      console.error('Failed to put object: %j', err);
      callback(err);
    });
  }).catch(function (err) {
    console.error('Failed to get object: %j', err);
    callback(err);
  });
};
