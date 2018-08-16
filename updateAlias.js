"use strict";

const AWS = require('aws-sdk');

const createAlias = require('./createAlias');


/**
 * Update lambda alias
 * @module
 */
/**
 * Updates alias for lambda with name the name of the package, for version
 * given
 *
 * @param  {string} functionName Lambda function name
 * @param  {string} name         The name/alias given to the latest version
 * @param  {string} version      The latest version of Lambda function published
 * @param  {object} apiInfo  Api info found in package json. Used with create alias
 * @return {Promise}              Lambda update response
 */
module.exports = function(functionName, name, version, api_info, account, aws_config) {
  const lambda = new AWS.Lambda(aws_config);

  if (!version) return Promise.reject('Invalid version');
  else return lambda.updateAlias({
      FunctionName: functionName,
      Name: name,
      FunctionVersion: version.toString()
    }).promise()
    .catch(err => {
      if (err.code == 'ResourceNotFoundException' && err.message.indexOf('Alias') !== -1) return createAlias(functionName, name, version, api_info, account, aws_config);
      else return Promise.reject(err);
    });
};
