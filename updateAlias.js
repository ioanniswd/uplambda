"use strict";

const exec = require('child_process').exec;
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
 * @param  {function} callback
 * @return {string}              Version changed and alias
 */
module.exports = function(functionName, name, version, callback) {

  exec(`aws lambda update-alias --function-name ${functionName} --name ${name} \
    --function-version ${version}`, function(err, stdout, stderr) {
    if (err) {
      // if ResourceNotFoundException
      if (err.code == 255) {
        createAlias(functionName, name, version, callback);
      } else {
        callback(err);
      }
    } else if (stderr) {
      callback(stderr);
    } else {
      let res = JSON.parse(stdout);
      callback(null, parseInt(res.FunctionVersion), res.Name);
    }
  });
};
