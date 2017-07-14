"use strict";

const exec = require('child_process').exec;

module.exports = function(functionName, name, version, callback) {

  exec(`aws lambda create-alias --function-name ${functionName} --name ${name} \
    --function-version ${version}`, function(err, stdout, stderr) {
      if(err) {
        callback(err);
      } else if (stderr) {
        callback(stderr);
      } else {
        let version = parseInt(JSON.parse(stdout).FunctionVersion);
        callback(null, version);
      }
  });

};
