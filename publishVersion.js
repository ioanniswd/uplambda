"use strict";
const exec = require('child_process').exec;


/**
 * Publishes a new version for Lambda
 * @module
 */
/**
 * Publish a new version for lambda function with name the name of the
 * package.
 *
 * @param  {string} functionName Lambda function name
 * @param  {function} callback
 * @return {version}              Just for confirmation
 */
module.exports = function(functionName, callback) {
  exec(`aws lambda publish-version --function-name ${functionName}`, function(err, stdout, stderr) {
    if (err) {
      callback(err);
    } else if (stderr) {
      callback(stderr);
    } else {
      let version = parseInt(JSON.parse(stdout).Version);
      callback(null, version);
    }
  });
};
