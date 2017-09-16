"use strict";

const exec = require('child_process').exec;
const getApiInfo = require('./getApiInfo');

/**
 * Uploads zip to S3 bucket.
 * @module
 */
/**
 * Uploads zip file to S3 bucket uplambda
 * which trigger a lambda function that
 * updates the code of the function with
 * the given name. Currently only works for
 * latest.
 *
 * @param  {string} name Name of the lambda function and zip file
 * @param  {function} done Callback
 * @return {string}      S3 upload response message
 */
module.exports = function(name, alias, info, done) {

  if (!alias) {
    // upload to latest
    exec(`aws s3 cp ${name}.zip s3://uplambda/code/latest/${name}.zip`, function(err, stdout, stderr) {
      if (err) {
        done(err);
      } else {
        if (stderr) {
          console.log('stderr:', stderr);
        }
        done(null, stdout);
      }
    });

  } else {
    // upload to version

    exec(`aws s3 cp ${name}.zip s3://uplambda/code/version/${name}.zip --metadata alias=${alias},apiid=${info.apiId},stageNames=${info.stageNames.join(':')},apimethod=${info.apiMethod}`, function(err, stdout, stderr) {
      if (err) {
        done(err);

      } else {
        if (stderr) console.log(stderr);
        done(null, stdout);
      }
    });
  }
};
