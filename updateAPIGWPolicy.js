"use strict";

const AWS = require('aws-sdk');

/**
 * Gives permissions to API GW to invoke Lambda function
 * @module
 */
/**
 * Gives permissions to resource named functionName.toLowerCase, to invoke Lambda
 * function alias.
 *
 * @param  {string} functionName Lambda function name
 * @param  {string} name         Branch name/lambda alias
 * @param  {function} callback
 * @param  {object} apiInfo  Api info found in package json
 * @return {Promise}
 */
module.exports = function(functionName, name, api_info, account, aws_config) {
  const lambda = new AWS.Lambda(aws_config);

  // for dev permissions
  const apiId = api_info.apiId || '*';
  const apiResourceName = api_info.resourceName || functionName.toLowerCase();
  const apiMethod = api_info.method || "POST";
  const statementId = Date.now().toString();

  // console.log('homedir:', homedir);

  return lambda.addPermission({
    Action: 'lambda:InvokeFunction',
    FunctionName: `arn:aws:lambda:${account}:function:${functionName}:${name}`,
    SourceArn: `arn:aws:execute-api:${account}:${apiId}/*/${apiMethod}/${apiResourceName}`,
    Principal: `apigateway.amazonaws.com`,
    StatementId: statementId
  }).promise();
};
