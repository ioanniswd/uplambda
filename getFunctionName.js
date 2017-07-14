"use strict";
const fs = require('fs');


module.exports = function(callback) {
  fs.readFile('package.json', 'utf-8', function(err, data) {
    if (err) {
      callback(err);
    } else {
      let functionName = JSON.parse(data).name;
      callback(null, functionName);
    }
  });
};
