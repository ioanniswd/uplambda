"use strict";
const exec = require('child_process').exec;

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
