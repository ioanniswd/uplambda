"use strict";

const exec = require('child_process').exec;

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
 * @param  {function} callback
 * @param  {object} apiInfo  Api info found in package json. Used with updateAPIGWPolicy
 * @return {string}              the most recent version for confirmation
 */
module.exports = function(functionName, name, version, api_info, callback) {

  // give permission to resource to call lambda alias
  exec(`aws lambda create-alias --function-name ${functionName} --name ${name} \
    --function-version ${version}`, function(err, stdout, stderr) {
    if (err) {
      callback(err);
    } else if (stderr) {
      callback(stderr);
    } else {

      let version = parseInt(JSON.parse(stdout).FunctionVersion);

      updateAPIGWPolicy(functionName, name, api_info, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log('Updated API GW permissions');
          callback(null, version);
        }
      });
    }
  });

};
