"use strict";
const fs = require('fs');


/**
 * Get Lambda name
 * @module
 */
/**
 * Get Lambda name using package.json name attribute.
 *
 * @return {string}          Lambda function name
 */
module.exports = function() {
  return new Promise(function(resolve, reject) {
    fs.readFile('package.json', 'utf-8', function(err, data) {
      if (err) reject(err);
      else resolve(JSON.parse(data).name);
    });
  });
};
