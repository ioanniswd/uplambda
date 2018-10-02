"use strict";

const fs = require('fs');

module.exports = function() {
  return new Promise(function(resolve, reject) {
      fs.readFile('package.json', 'utf-8', function(err, data) {
        if (err) reject(err);
        else {
          data = JSON.parse(data);
          // console.log('data:', data);
          if (!data.no_api && data.no_api !== false) data.no_api = true;
          if (!data.files) data.files = [];
          if (!data.lambda_role) data.lambda_role = '';

          if (!data.api) {
            data.api = {
              apiId: null,
              stageNames: [],
              method: null
            };

          } else {
            if (!data.api.apiId && data.api.apiId !== null) data.api.apiId = null;
            if (!data.api.stageNames) data.api.stageNames = [];
            if (!data.api.method && data.api.method !== null) data.api.method = null;
            if (!data.api.RootResourceId) data.api.RootResourceId = null;
          }

          if (!data.lambdaAlias && data.lambdaAlias !== null) data.lambdaAlias = null;

          if (!fs.existsSync('cloudformation')) fs.mkdirSync('cloudformation');
          if (!fs.existsSync(`cloudformation/stack.json`)) {
            const stack = JSON.parse(fs.readFileSync(__dirname + '/lib/stack.json', 'utf-8'));
            if (!data.no_api && data.api.apiId && data.api.method) {
              const api_gw_stack = JSON.parse(fs.readFileSync(__dirname + '/lib/api_gw_resources.json', 'utf-8'));
              Object.assign(stack.Resources, api_gw_stack);
            }

            fs.writeFileSync(`cloudformation/stack.json`, JSON.stringify(stack, null, 2));
          }

          if (!fs.existsSync(`cloudformation/params.json`)) fs.writeFileSync(`cloudformation/params.json`, fs.readFileSync(__dirname + '/lib/params.json', 'utf-8'));


          resolve(data);
        }
      });
    })
    .then(data => {
      return new Promise(function(resolve, reject) {
        fs.writeFile('package.json', JSON.stringify(data, null, '\t'), err => err ? reject(err) : resolve('success'));
      });
    })
    .then(() => Promise.resolve('success'));
};
