#!/usr/bin/env node

"use strict";

const AWS = require('aws-sdk');
AWS.config.update({
  region: 'eu-west-1'
});
const lambda = new AWS.Lambda();

const exec = require('child_process').exec;
const fs = require('fs');
const homedir = require('os').homedir();
const minimist = require('minimist');
const colors = require('colors/safe');
const JSZip = require("jszip");
const _ = require('lodash');

const getFunctionName = require('./getFunctionName');
const updateAlias = require('./updateAlias');
const updateStageVariables = require('./updateStageVariables');
const getBranches = require('./getBranches');
const getApiInfo = require('./getApiInfo');
const updateAPIGWPolicy = require('./updateAPIGWPolicy');
const verifyCorrectAlias = require('./verifyCorrectAlias');
const uploadS3 = require('./uploadS3');
const initApiAlias = require('./initApiAlias');
const getStageVariable = require('./getStageVariable');
const depcheck = require('depcheck');

/**
 * Uploads lambda to AWS and updates API GW stage variables and permission
 * @module Uplambda
 */

var alias;
var otherBranches;
var functionName;
var api_info;

var args = minimist(process.argv.slice(2), {
  boolean: ['logs', 'v', 'version', 's3', 'publish', 'f', 'force']
});

var localPath = 'localLambdas/';

var package_json = JSON.parse(fs.readFileSync(process.cwd() + '/package.json', 'utf-8'));

if (args.v || args.version) {
  exec('npm show uplambda version', function(err, stdout, stderr) {
    if (err) throw err;
    else {
      if (stderr) console.log(stderr);
      process.stdout.write(stdout);
    }
  });

} else {

  new Promise(function(resolve, reject) {
      // check js files for deps
      depcheck(process.cwd(), {}, unused => {
        try {
          // console.log('unused:', unused);
          var deps = Object.keys(unused.missing).filter(dep => dep !== 'aws-sdk' && dep !== 'popper.js');
          if (deps.length > 0) {
            deps.forEach(key => {
              console.log(colors.red('Missing dep: ', key));
              console.log('Files:');
              unused.missing[key].forEach(path => {
                console.log(path.substring(path.indexOf(process.cwd()) + process.cwd().length + 1));
              });
            });

            if (!args.f && !args.force) reject('Missing deps, not uploading');
            else resolve();

          } else resolve();

        } catch (e) {
          reject(e);
        }

      });
    })
    // check installed modules for missing deps
    .then(() => {
      return Promise.all(Object.keys(package_json.dependencies).map(dep => {
        try {
          console.log('dep:', dep);
          if (dep == 'aws-sdk') return Promise.resolve();
          else return require.resolve(process.cwd() + '/node_modules/' + dep);

        } catch (err) {
          return Promise.reject('Cannot find module: ' + dep);
        }
      }));
    })
    // check if required files are in the folder
    .then(() => {
      if (!package_json.files) return Promise.resolve();
      else {
        let missing = _.find(package_json.files, filename => !fs.existsSync(`${process.cwd()}/${filename}`));
        return missing ? Promise.reject(`File: ${missing} is missing`) : Promise.resolve();
      }
    })
    // update packages
    .then(() => {
      return new Promise(function(resolve, reject) {
        exec('npm update --no-save', (err, stderr, stdout) => {
          if (err) reject(err);
          if (stderr) reject(stderr);
          else resolve();
        });
      });
    })
    .then(() => getApiInfo())
    // get branches
    .then(_api_info => {
      // console.log('\n');
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
    // init api/alias info in package.json
    .then(res => {
      alias = res.currentBranch;
      otherBranches = res.otherBranches;
      return initApiAlias();
    })
    .then(() => verifyCorrectAlias(alias))
    // logs, get functionName
    .then(aliasVerified => {
      if (aliasVerified) console.log('Alias in package.json is correct');
      else {
        console.log(colors.red('Alias in package.json is not correct'));
        if (args.publish) return Promise.reject('Alias should be the name of the current branch');
        else console.log(colors.red('Alias should be the name of the current branch'));
      }
      return getFunctionName();
    })
    // zip folder
    .then(_functionName => {
      functionName = _functionName;
      // console.log('localPath: ', localPath);
      // console.log('functionName:', functionName);
      return new Promise(function(resolve, reject) {
        exec(`zip -r ${homedir}/${localPath}/${functionName}.zip . -x *.git*`, {
          maxBuffer: 1e8
        }, function(err, stdout, stderr) {
          if (err) reject(err);
          else if (stderr) reject(stderr);
          else resolve();
        });
      });
    })
    // get zip
    .then(() => {
      console.log('Zip done..');
      process.chdir(`${homedir}/${localPath}`);
      return new JSZip.external.Promise(function(resolve, reject) {
        fs.readFile(`${functionName}.zip`, function(err, data) {
          if (err) reject(err);
          else resolve(data);
        });
      });
    })
    .then(zip => {

      if (args.s3) {
        console.log(`Uploading ${args.publish ? alias : '$LATEST'} to s3..`);
        if (!args.publish) return uploadS3(functionName, zip, null, null);
        else {
          console.log('info.apiId: ', api_info.apiId);
          console.log('info.stageNames: ', api_info.stageNames);
          console.log('info.method:', api_info.method);

          return uploadS3(functionName, zip, alias, api_info);
        }

      } else {
        console.log(`Uploading to ${args.publish ? colors.cyan(alias) : colors.cyan('$LATEST')}..`);
        return lambda.updateFunctionCode({
            FunctionName: functionName,
            Publish: !!args.publish,
            ZipFile: zip
          }).promise()
          .then(res => {
            console.log('Upload done.');
            // console.log(res);
            var apiResourceName = functionName.toLowerCase();
            var version = res.Version;
            // console.log(`Version: ${version}`);

            if (args.publish) {
              if (!api_info || !api_info.apiId || !api_info.method || !api_info.stageNames || api_info.stageNames.length === 0 || !alias) return Promise.reject('Invalid api/alias info');
              else {
                // console.log('info.apiId: ', api_info.apiId);
                // console.log('info.stageNames: ', api_info.stageNames);
                // console.log('info.method:', api_info.method);

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
            } else return updateAlias(functionName, 'dev', '$LATEST', api_info)
              .then(() => updateAPIGWPolicy(functionName, 'dev', api_info));
          });
      }
    })
    // if uploading to $LATEST, check dev stage variable of api to confirm dev alias is invoked
    .then(() => {
      if (args.publish || !api_info.apiId) return Promise.resolve();
      else {
        return getStageVariable(api_info.apiId, functionName)
          .then(stageVariable => {
            if (stageVariable !== 'dev') {
              console.log('\n' + colors.red(`Stage Variable in API GW Stage 'dev':${stageVariable}`));
              console.log('\n' + colors.red(`For tests on front end, set Stage Variable with name '${functionName}' equal to 'dev' in API GW, stage 'dev'`));
            } else console.log('\n' + colors.green(`Stage Variable in API GW Stage 'dev':${stageVariable}`));
            return Promise.resolve();
          });
      }
    })
    .then(() => {
      console.log('\n' + colors.green('Success'));
      if (args.logs) exec(`awslogs get /aws/lambda/${functionName} --watch`).stdout.pipe(process.stdout);
    })
    .catch(err => {
      console.log(colors.red(err));
      process.exit(1);
    });
}
