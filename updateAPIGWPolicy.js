"use strict";

const exec = require('child_process').exec;
const getApiInfo = require('./getApiInfo');
const getBranches = require('./getBranches');
const fs = require('fs');
const homedir = require('os').homedir();

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
 * @return {obj}              Error if occured
 */
module.exports = function(functionName, name, callback) {

  getApiInfo(function(err, apiInfo) {
    if (err) {
      console.log(err);
    } else {
      let apiId = apiInfo.apiId;
      let apiResourceName = apiInfo.resourceName || functionName.toLowerCase();
      let apiMethod = apiInfo.method || "POST";
      let statementId = Date.now();

      console.log('homedir:', homedir);
      fs.readFile(homedir + '/.uplambda', 'utf-8', function(err, data) {
        if (err) {
          callback(err);
        } else {
          let account = JSON.parse(data).account;

          exec(`aws lambda add-permission --function-name arn:aws:lambda:${account}:function:${functionName}:${name} --source-arn arn:aws:execute-api:${account}:${apiId}/*/${apiMethod}/${apiResourceName} --principal apigateway.amazonaws.com --statement-id ${statementId} --action lambda:InvokeFunction`, function(err, stdout, stderr) {
            if (err) {
              callback(err);
            } else if (stderr) {
              callback(stderr);
            } else {
              callback();
            }
          });

        }
      });

    }
  });

};
