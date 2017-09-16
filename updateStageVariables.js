"use strict";
const exec = require('child_process').exec;
const getApiInfo = require('./getApiInfo');

// name is the alias for the current version
module.exports = function(functionName, name, api_info, callback) {

  let apiId = api_info.apiId;
  let stageNames = api_info.stageNames;
  stageNames.forEach(function(stageName) {
    exec(`aws apigateway update-stage --rest-api-id  ${apiId} --stage-name ${stageName} \
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
