"use strict";

const AWS = require('aws-sdk');

const _ = require('lodash');

module.exports = (functionName, name, api_info, account) => {
  AWS.config.update({
    region: account.match(/^(.+):/)[1]
  });
  const lambda = new AWS.Lambda();

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
