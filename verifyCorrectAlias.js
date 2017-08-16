"use strict";

const fs = require('fs');

module.exports = function(branchName, callback) {
  fs.readFile('package.json', 'utf-8', function(err, data) {
    if (err) {
      callback(err);
    } else {
      let verified = JSON.parse(data).lambdaAlias == branchName;
      callback(null, verified);
    }
  });
};