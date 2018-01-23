"use strict";

const AWS = require('aws-sdk');
AWS.config.update({
  region: 'eu-west-1'
});
const lambda = new AWS.Lambda();

/**
 * Publishes a new version for Lambda
 * @module
 */
/**
 * Publish a new version for lambda function with name the name of the
 * package.
 *
 * @param  {string} functionName Lambda function name
 * @return {version}              Just for confirmation
 */
module.exports = function(functionName) {
  return lambda.publishVersion({
      FunctionName: functionName
    }).promise()
    .then(res => Promise.resolve(res.Version));
};
