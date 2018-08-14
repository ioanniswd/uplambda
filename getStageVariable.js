"use strict";

const AWS = require('aws-sdk');

module.exports = function(apiId, functionName, account) {
  AWS.config.update({
    region: account.match(/^(.+):/)[1]
  });
  const apigw = new AWS.APIGateway();

  return apigw.getStage({
      restApiId: apiId,
      stageName: 'dev'
    }).promise()
    .then(data => Promise.resolve(data.variables ? data.variables[functionName] : undefined));
};
