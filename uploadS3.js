"use strict";

const AWS = require('aws-sdk');

/**
 * Uploads zip to S3 bucket.
 * @module
 */
/**
 * Uploads zip file to S3 bucket uplambda
 * which trigger a lambda function that
 * updates the code of the function with
 * the given name. Currently only works for
 * latest.
 *
 * @param  {string} name Name of the lambda function and zip file
 * @return {Promise}      S3 upload response message
 */
module.exports = function(name, zip, alias, info, account, bucket, s3_prefix, aws_config) {
  const s3 = new AWS.S3(aws_config);

  // console.log('bucket:', bucket);
  // console.log('s3_prefix:', s3_prefix);

  const params = {
    Bucket: bucket,
    Key: `${s3_prefix}${name}.zip`,
    ContentType: 'application/zip',
    Body: zip
  };

  if (alias) {
    // console.log('info:', info);
    params.Metadata = {
      alias: alias,
      apiId: info.apiId,
      stageNames: info.stageNames.join(':'),
      apiMethod: info.method
    };
  }

  // console.log('params:', params);

  return s3.upload(params).promise();
};
