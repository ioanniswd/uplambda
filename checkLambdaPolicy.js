"use strict";

const AWS = require('aws-sdk');
AWS.config.update({
  region: 'eu-west-1'
});
const lambda = new AWS.Lambda();

const _ = require('lodash');

module.exports = (functionName, name, api_info, account) => {
  // for dev permissions
  const apiId = api_info.apiId || '*';
  const apiResourceName = api_info.resourceName || functionName.toLowerCase();
  const apiMethod = api_info.method || "POST";

  return lambda.getPolicy({
      FunctionName: functionName,
      Qualifier: name
    }).promise()
    .then(res => {
      const policy = JSON.parse(res.Policy);

      const found = !!_.find(policy.Statement, st => st.Effect === 'Allow' &&
        st.Action === 'lambda:InvokeFunction' &&
        st.Resource === `arn:aws:lambda:${account}:function:${functionName}:${name}` &&
        st.Condition && st.Condition.ArnLike &&
        st.Condition.ArnLike['AWS:SourceArn'] === `arn:aws:execute-api:${account}:${apiId}/*/${apiMethod}/${apiResourceName}`
      );

      if (found) console.log('Policy exists not updating');
      else console.log('Policy not found, updating');

      return Promise.resolve(found);
    })
    .catch(err => {
      console.log('err:', err);
      return Promise.reject(err);
    });
};
