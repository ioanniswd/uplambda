"use strict";

const fs = require('fs');

/**
 * Get api info for branch
 * @module
 */
/**
 * Get Api Id and Stage Name(s)
 *
 * @return {Promise}          apiId and stageNames
 */
module.exports = function() {

  return new Promise(function(resolve, reject) {
    fs.readFile('package.json', 'utf-8', function(err, data) {
      if (err) reject(err);
      else {
        data = JSON.parse(data);
        let info = {};
        if (data.api) {
          info = {
            apiId: data.api.apiId,
            stageNames: data.api.stageNames,
            method: data.api.method
          };
        }

        resolve(info);
      }
    });
  });
};
