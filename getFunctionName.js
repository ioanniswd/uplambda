"use strict";
const fs = require('fs');


/**
 * Get Lambda name
 * @module
 */
/**
 * Get Lambda name using package.json name attribute.
 *
 * @param  {function} callback description
 * @return {string}          Lambda function name
 */
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
