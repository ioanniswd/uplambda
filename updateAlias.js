"use strict";

const exec = require('child_process').exec;
const createAlias = require('./createAlias');

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
