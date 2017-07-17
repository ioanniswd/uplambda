#!/usr/bin/env node

"use strict";
const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
const path = require('path');
const fs = require('fs');
const homedir = require('os').homedir() + '/';
const zlib = require('zlib');
const ncp = require('ncp').ncp;
const minimist = require('minimist');

const publishVersion = require('./publishVersion');
const getFunctionName = require('./getFunctionName');
const updateAlias = require('./updateAlias');
const updateStageVariables = require('./updateStageVariables');
const getBranches = require('./getBranches');

console.log('homedir: ', homedir);

function returnNotGit(fileName) {
  return fileName.indexOf('.git') == -1;
}

var args = minimist(process.argv.slice(2), {
  boolean: ['logs', 'v', 'version']
});

var localPath = 'localLambdas/';

var invokeFolder = process.cwd();
console.log('current directory: ', invokeFolder);

getFunctionName(function(err, functionName) {
  if (err) {
    console.log(err);
  } else {

    localPath += functionName;
    console.log('localPath: ', localPath);
    process.chdir(homedir);
    if (!fs.existsSync(localPath)) {
      console.log('local path does not exist');
      var dirs = localPath.split('/');
      console.log('dirs: ', dirs);
      dirs.forEach(function(dir) {
        if (!fs.existsSync(dir)) {
          console.log('making dir: ', dir);
          fs.mkdirSync(dir);
        }
        process.chdir(dir);
      });
    } else {
      console.log('local path exists');
      process.chdir(localPath);
    }

    ncp(invokeFolder, process.cwd(), {
      filter: returnNotGit
    }, function(err, files) {
      console.log('files: ', files);

      console.log('Removing unnecessary modules...');

      exec('npm prune', function(err, stdout, stderr) {
        if (err) {
          console.log('err:', err);
        } else {
          console.log('stderr: ', stderr);
          console.log('Installing missing modules...');

          exec('npm-install-missing', function(err, stdout, stderr) {
            console.log('err:', err);
            console.log('stderr: ', stderr);
            console.log(stdout);
            console.log('Executing zip...');
            console.log('pwd: ', process.cwd());

            exec(`zip -FSr ${functionName}.zip .`, {maxBuffer: 1024 * 1024}, function(err, stdout, stderr) {
              if (err) {
                console.log(err);
              } else if (stderr) {
                console.log('stderr: ', stderr);
              } else {
                console.log(stdout);
                console.log('Zip done.');
                exec(`aws lambda  update-function-code --function-name ${functionName}  --zip-file fileb://${functionName}.zip`, {maxBuffer: 1024 * 1024}, function(err, stdout, stderr) {
                  if (err) {
                    console.log(err);
                  } else if (stderr) {
                    console.log('stderr ', stderr);
                  } else {
                    console.log('Upload done.');
                    if (args.version || args.v) {

                      getBranches(function(err, currentBranch, otherBranches) {
                        if (err) {
                          console.log(err);
                        } else {
                          let alias = currentBranch;

                          // publish new version (keep version number)
                          publishVersion(functionName, function(err, version) {
                            if (err) {
                              console.log(err);
                            } else {

                              // this is the version that was published
                              console.log(`Version: ${version}`);

                              // update alias or create it if it does not exist
                              updateAlias(functionName, alias, version, function(err, version) {

                                if (err) {
                                  console.log(err);
                                } else {
                                  // update api stage variables (apiId, stageNames)
                                  updateStageVariables(functionName, alias, function(err) {
                                    if (err) {
                                      console.log(err);
                                    } else {
                                      console.log('Current Branch/Lambda Alias:', alias);
                                      if(otherBranches.length > 0) {
                                        console.log('Other Branches:');
                                        otherBranches.forEach(function(branchName) {
                                          console.log(branchName);
                                        });
                                      } else {
                                        console.log('No other branches');
                                      }
                                      console.log('Success');
                                      if (args.logs) {
                                        exec(`awslogs get /aws/lambda/${functionName} --watch`).stdout.pipe(process.stdout);
                                      }
                                    }
                                  });
                                }
                              });
                            }
                          });
                        }
                      });
                    } else {
                      if (args.logs) {
                        exec(`awslogs get /aws/lambda/${functionName} --watch`).stdout.pipe(process.stdout);
                      }
                    }
                  }
                });
              }
            });
          });
        }
      });
    });
  }
});
