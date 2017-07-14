"use strict";
const fs = require('fs');
const exec = require('child_process').exec;

// name is the alias for the current version
module.exports = function(functionName, name, callback) {

  fs.readFile('package.json', 'utf-8', function(err, data) {
    data = JSON.parse(data);
    exec(`aws apigateway update-stage --rest-api-id  ${data.api.apiId} --stage-name ${data.api.stageName} \
      --patch-operations op="replace",path="/variables/${functionName}",value="${name}"`, function(err, stdout, stderr) {
      if (err) {
        callback(err);
      } else if (stderr) {
        callback(stderr);
      } else {
        callback(null);
      }
    });
  });
};
