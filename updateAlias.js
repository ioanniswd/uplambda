"use strict";

const exec = require('child_process').exec;
const createAlias = require('./createAlias');

module.exports = function(functionName, name, version, callback) {

  exec(`aws lambda update-alias --function-name ${functionName} --name ${name}`, function(err, stdout, stderr) {
    if (err) {
      callback(err);
    } else if (stderr) {
      if (stderr == 'ResourceNotFoundException') {
        createAlias(functionName, name, version, callback);
      } else {
        callback(stderr);
      }
    } else {
      let res = JSON.parse(stdout);
      callback(null, parseInt(res.FunctionVersion), res.Name);
    }
  });
};
