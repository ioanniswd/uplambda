"use strict";

const AWS = require('aws-sdk');

module.exports = function(apiId, functionName, account, aws_config) {
  const apigw = new AWS.APIGateway(aws_config);

  console.log('stage');
  return apigw.getStage({
      restApiId: apiId,
      stageName: 'dev'
    }).promise()
    .then(data => Promise.resolve(data.variables ? data.variables[functionName] : undefined));
};
