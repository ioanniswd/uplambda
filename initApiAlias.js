"use strict";

const fs = require('fs');

module.exports = function() {
  return Promise.all([
      new Promise(function(resolve, reject) {
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
            }

            if (!data.lambdaAlias && data.lambdaAlias !== null) data.lambdaAlias = null;
            resolve(data);
          }
        });
      })
      .then(data => {
        return new Promise(function(resolve, reject) {
          fs.writeFile('package.json', JSON.stringify(data, null, '\t'), err => err ? reject(err) : resolve('success'));
        });
      }),
      new Promise(function(resolve) {
        const dir = 'cloudformation';
        const stack = 'stack.json';

        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        if (!fs.existsSync(`${dir}/${stack}`)) fs.writeFileSync(`${dir}/${stack}`, fs.readFileSync(__dirname + '/lib/stack.json', 'utf-8'));

        resolve();
      })
    ])
    .then(() => Promise.resolve('success'));
};
