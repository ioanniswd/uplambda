#!/usr/bin/env node

"use strict";

const AWS = require('aws-sdk');
AWS.config.update({
  region: 'eu-west-1'
});
const lambda = new AWS.Lambda();

const exec = require('child_process').exec;
const path = require('path');
const fs = require('fs');
const homedir = require('os').homedir();
const minimist = require('minimist');
const colors = require('colors/safe');

const publishVersion = require('./publishVersion');
const getFunctionName = require('./getFunctionName');
const updateAlias = require('./updateAlias');
const updateStageVariables = require('./updateStageVariables');
const getBranches = require('./getBranches');
const getApiInfo = require('./getApiInfo');
const verifyCorrectAlias = require('./verifyCorrectAlias');
const uploadS3 = require('./uploadS3');
const initApiAlias = require('./initApiAlias');


/**
 * Uploads lambda to AWS and updates API GW stage variables and permission
 * @module Uplambda
 */

var alias;
var otherBranches;
var functionName;
var api_info;

var args = minimist(process.argv.slice(2), {
  boolean: ['logs', 'v', 'version, s3, publish']
});

var localPath = 'localLambdas/';

if (args.v || args.version) {
  exec('npm show uplambda version', function(err, stdout, stderr) {
    if (err) throw err;
    else {
      if (stderr) console.log(stderr);
      process.stdout.write(stdout);
    }
  });

} else {
  getApiInfo()
    .then(_api_info => {
      api_info = _api_info;
      if (!api_info.apiId) console.log(colors.green('Not used by any API'));
      else if (!api_info.stageNames || api_info.stageNames.length === 0) console.log(colors.green('Not used by any Stage'));
      else {
        console.log(colors.blue('Used in stages:'));
        api_info.stageNames.forEach(function(stageName) {
          console.log(colors.cyan(stageName));
        });
      }

      return getBranches();
    })
    .then(res => {
      alias = res.currentBranch;
      otherBranches = res.otherBranches;
      return initApiAlias();
    })
    .then(() => verifyCorrectAlias(alias))
    .then(aliasVerified => {
      if (aliasVerified) console.log('Alias in package.json is correct');
      else {
        console.log(colors.red('Alias in package.json is not correct'));
        if (args.publish) return Promise.reject('Alias should be the name of the current branch');
        else console.log(colors.red('Alias should be the name of the current branch'));

        return getFunctionName();
      }
    })
    .then(_functionName => {
      functionName = _functionName;
      console.log('localPath: ', localPath);
      console.log('functionName:', functionName);
      return new Promise(function(resolve, reject) {
        exec(`zip -r ${homedir}/${localPath}/${functionName}.zip . -x *.git*`, {
          maxBuffer: 1024 * 1024
        }, function(err, stdout, stderr) {
          if (err) reject(err);
          else if (stderr) reject(stderr);
          else resolve();
        });
      });
    })
    .then(() => {
      console.log('Zip done.');
      process.chdir(`${homedir}/${localPath}`);

      if (args.s3) {
        console.log('Uploading to s3..');
        if (!args.publish) return uploadS3(functionName, null, null);
        else {
          console.log('info.apiId: ', api_info.apiId);
          console.log('info.stageNames: ', api_info.stageNames);
          console.log('info.apiMethod:', api_info.apiMethod);

          return uploadS3(functionName, alias, api_info);
        }

      } else {
        return lambda.updateFunctionCode({
          FunctionName: functionName,
          Publish: !!args.publish,
          ZipFile: ''
        }).promise();
      }
    })
    .then(res => {
      console.log('Upload done.');
      console.log(res);
      var apiResourceName = functionName.toLowerCase();
      var version = res.Version;
      console.log(`Version: ${version}`);

      if (args.publish) {
        if (!api_info || !api_info.apiId || !api_info.method || !api_info.stageNames || api_info.stageNames.length === 0 || !alias) return Promise.reject('Invalid api/alias info');
        else {
          console.log('info.apiId: ', api_info.apiId);
          console.log('info.stageNames: ', api_info.stageNames);
          console.log('info.method:', api_info.method);

          return updateAlias(functionName, alias, version, api_info)
            .then(() => updateStageVariables(functionName, alias, api_info))
            .then(() => {
              console.log(colors.blue('Current Branch/Lambda Alias:'), colors.green(alias));
              if (otherBranches.length > 0) {
                console.log(colors.blue('Other Branches:'));
                otherBranches.forEach(function(branchName) {
                  if (branchName[0] == branchName[0].toUpperCase()) console.log(colors.yellow(branchName));
                  else console.log(branchName);

                });
              } else console.log(colors.yellow('No other branches'));

              return Promise.resolve();
            });
        }
      } else return Promise.resolve();
    })
    .then(() => {
      console.log('\n' + colors.green('Success'));
      if (args.logs) exec(`awslogs get /aws/lambda/${functionName} --watch`).stdout.pipe(process.stdout);
      else process.stdout.write('Done');
    })
    .catch(err => {
      console.log(colors.red(err));
      process.exit(1);
    });
}
