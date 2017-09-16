"use strict";

const fs = require('fs');

/**
 * Get api info for branch
 * @module
 */
/**
 * Get Api Id and Stage Name(s)
 *
 * @param  {function} callback
 * @return {object}          apiId and stageNames
 */
module.exports = function(callback) {

  fs.readFile('package.json', 'utf-8', function(err, data) {
    if (err) {
      callback(err);
    } else {
      data = JSON.parse(data);
      let info = {};
      if (data.api) {
        info = {
          api_id: data.api.apiId,
          stage_names: data.api.stageNames,
          method: data.api.method
        };
      }
      callback(null, info);
    }
  });
};
