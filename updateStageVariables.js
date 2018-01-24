"use strict";

const AWS = require('aws-sdk');
AWS.config.update({
  region: 'eu-west-1'
});
const apigateway = new AWS.APIGateway();

const exec = require('child_process').exec;
const getApiInfo = require('./getApiInfo');

// name is the alias for the current version
module.exports = function(functionName, name, api_info) {

  let apiId = api_info.apiId;
  let stageNames = api_info.stageNames;

  // console.log('api_info:', api_info);

  var promises = stageNames.map(stageName => apigateway.updateStage({
    restApiId: apiId,
    stageName: stageName,
    patchOperations: [{
      op: "replace",
      path: `/variables/${functionName}`,
      value: name
    }]
  }).promise());

  return Promise.all(promises)
    .then(res => {
      // console.log('res:', res);
      return Promise.resolve();
    });
};
