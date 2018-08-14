"use strict";

const AWS = require('aws-sdk');

const updateAPIGWPolicy = require('./updateAPIGWPolicy');

/**
 * Create Lambda Alias
 * @module
 */
/**
 * Create a new alias for the last version published for lambda and assigns
 * permissions to the appropriate API GW resource for that alias
 *
 * @param  {string} functionName name of lambda function and current branch
 * @param  {string} name         the name/alias to be given to the new lambda version
 * @param  {string} version      the most recent version which was just published
 * @param  {object} apiInfo  Api info found in package json. Used with updateAPIGWPolicy
 * @return {Promise}              Update Api GW Policy response
 */
module.exports = function(functionName, name, version, api_info, account) {
  AWS.config.update({
    region: account.match(/^(.+):/)[1]
  });
  const lambda = new AWS.Lambda();

  if (!version) return Promise.reject('Invalid version');
  else return lambda.createAlias({
      FunctionName: functionName,
      FunctionVersion: version.toString(),
      Name: name
    }).promise()
    .then(() => (api_info && api_info.apiId) ? updateAPIGWPolicy(functionName, name, api_info, account) : Promise.resolve());
};
