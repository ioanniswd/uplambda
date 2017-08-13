"use strict";

const exec = require('child_process').exec;


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
module.exports = function(name, done) {

  exec(`aws s3 cp ${name}.zip s3://uplambda/latest/${name}.zip`, function(err, stdout, stderr) {
    if(err) {
      done(err);
    } else {
      if(stderr) {
        console.log('stderr:', stderr);
      }
      done(null, stdout);
    }
  });
};
