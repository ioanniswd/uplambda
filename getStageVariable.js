"use strict";

const AWS = require('aws-sdk');
AWS.config.update({
  region: 'eu-west-1'
});
const apigw = new AWS.APIGateway();

module.exports = function(apiId, functionName) {
  return apigw.getStage({
      restApiId: apiId,
      stageName: 'dev'
    }).promise()
    .then(data => Promise.resolve(data.variables[functionName]));
};
