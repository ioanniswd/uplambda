"use strict";
const exec = require('child_process').exec;
const getApiInfo = require('./getApiInfo');

// name is the alias for the current version
module.exports = function(functionName, name, callback) {

  getApiInfo(function(err, apiInfo) {
    if (err) {
      callback(err);
    } else {
      let apiId = apiInfo.apiId;
      let stageNames = apiInfo.stageNames;
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
    }
  });
};
