"use strict";

const AWS = require('aws-sdk');
AWS.config.update({
  region: 'eu-west-1'
});
const s3 = new AWS.S3();

const getApiInfo = require('./getApiInfo');

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
module.exports = function(name, alias, info) {

  var params = {
    Bucket: 'uplambda',
    Key: `code/latest/${name}.zip`,
    ContentType: 'application/zip',
    Body: ''
  };

  if (alias) {
    params.Metadata = {
      alias: alias,
      apiId: info.apiId,
      stageNames: info.stageNames.join(':'),
      apiMethod: info.apiMethod
    };
  }

  return s3.upload(params).promise();
};
