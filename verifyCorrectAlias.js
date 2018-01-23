"use strict";

const fs = require('fs');

module.exports = function(branchName) {
  return new Promise(function(resolve, reject) {
    fs.readFile('package.json', 'utf-8', function(err, data) {
      if (err) reject(err);
      else resolve(JSON.parse(data).lambdaAlias == branchName);
    });
  });
};
