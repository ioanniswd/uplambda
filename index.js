#!/usr/bin/env node

"use strict";
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

var args = minimist(process.argv.slice(2), {
  boolean: ['logs', 'v', 'version, s3, publish']
});

var localPath = 'localLambdas/';

if (args.v || args.version) {
  exec('npm show uplambda version', function(err, stdout, stderr) {
    if (err) {
      throw err;

    } else {
      if (stderr) console.log(stderr);
      process.stdout.write(stdout);
    }
  });
} else {

  getApiInfo(function(err, api_info) {
    if (err) {
      console.log(colors.red(err));

    } else {

      if (!api_info.apiId) {
        console.log(colors.green('Not used by any API'));

      } else {
        if (!api_info.stageNames || api_info.stageNames.length === 0) {
          console.log(colors.green('Not used by any Stage'));

        } else {
          console.log(colors.blue('Used in stages:'));
          api_info.stageNames.forEach(function(stageName) {
            console.log(colors.cyan(stageName));
          });
        }
      }
      getBranches(function(err, currentBranch, otherBranches) {
        if (err) {
          console.log(colors.red(err));
        } else {
          let alias = currentBranch;

          initApiAlias(function(err) {
            if (err) {
              throw err;

            } else {
              verifyCorrectAlias(currentBranch, function(err, aliasVerified) {
                if (err) {
                  console.log(colors.red(err));
                } else {
                  if (aliasVerified) {
                    console.log('Alias in package.json is correct');
                  } else {
                    console.log(colors.red('Alias in package.json is not correct'));
                    if (args.publish) {
                      throw new Error('Alias should be the name of the current branch');

                    } else {
                      console.log(colors.red('Alias should be the name of the current branch'));
                    }
                  }
                  getFunctionName(function(err, functionName) {
                    if (err) {
                      console.log(colors.red(err));
                    } else {

                      console.log('localPath: ', localPath);
                      console.log('functionName:', functionName);

                      // zip contents
                      exec(`zip -r ${homedir}/${localPath}/${functionName}.zip . -x *.git*`, {
                        maxBuffer: 1024 * 1024
                      }, function(err, stdout, stderr) {
                        if (err) {
                          console.log(colors.red(err));
                        } else if (stderr) {
                          console.log(colors.red('stderr: ', stderr));
                        } else {
                          // console.log(stdout);
                          console.log('Zip done.');
                          process.chdir(`${homedir}/${localPath}`);
                          if (args.s3) {
                            console.log('Uploading to s3..');
                            if (!args.publish) {
                              uploadS3(functionName, null, null, function(err, res) {
                                if (err) {
                                  throw err;
                                } else {
                                  console.log(res);
                                  console.log('Done');
                                }
                              });

                            } else {
                              console.log('info.apiId: ', api_info.apiId);
                              console.log('info.stageNames: ', api_info.stageNames);
                              console.log('info.apiMethod:', api_info.apiMethod);
                              uploadS3(functionName, alias, api_info, function(err, res) {
                                if (err) {
                                  throw err;
                                } else {
                                  console.log(res);
                                  console.log('Done');
                                }
                              });
                            }
                          } else {

                            exec(`aws lambda  update-function-code --function-name ${functionName}  --zip-file fileb://${functionName}.zip`, {
                              maxBuffer: 1024 * 1024
                            }, function(err, stdout, stderr) {
                              if (err) {
                                console.log(colors.red(err));
                              } else if (stderr) {
                                console.log(colors.red('stderr ', stderr));
                              } else {
                                console.log('Upload done.');
                                let apiResourceName = functionName.toLowerCase();
                                if (args.publish) {

                                  // console.log('api_info:', api_info);
                                  if (!api_info || !api_info.apiId || !api_info.method || !api_info.stageNames || api_info.stageNames.length === 0 || !alias) {
                                    console.log(colors.red('Invalid api/alias info'));
                                    throw new Error('Invalid api/alias info');

                                  } else {
                                    console.log('info.apiId: ', api_info.apiId);
                                    console.log('info.stageNames: ', api_info.stageNames);
                                    console.log('info.method:', api_info.method);

                                    // publish new version (keep version number)
                                    publishVersion(functionName, function(err, version) {
                                      if (err) {
                                        console.log(colors.red(err));
                                      } else {

                                        // this is the version that was published
                                        console.log(`Version: ${version}`);

                                        // update alias or create it if it does not exist
                                        updateAlias(functionName, alias, version, api_info, function(err, version) {

                                          if (err) {
                                            console.log(colors.red(err));
                                          } else {
                                            // update api stage variables (apiId, stageNames), if api info exists

                                            updateStageVariables(functionName, alias, api_info, function(err) {
                                              if (err) {
                                                console.log(colors.red(err));
                                              } else {
                                                console.log(colors.blue('Current Branch/Lambda Alias:'), colors.green(alias));
                                                if (otherBranches.length > 0) {
                                                  console.log(colors.blue('Other Branches:'));
                                                  otherBranches.forEach(function(branchName) {
                                                    if (branchName[0] == branchName[0].toUpperCase()) {
                                                      console.log(colors.yellow(branchName));
                                                    } else {
                                                      console.log(branchName);
                                                    }
                                                  });
                                                } else {
                                                  console.log(colors.yellow('No other branches'));
                                                }
                                                console.log('\n' + colors.green('Success'));
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
                                } else {
                                  if (args.logs) {
                                    exec(`awslogs get /aws/lambda/${functionName} --watch`).stdout.pipe(process.stdout);
                                  }
                                }
                              }
                            });
                          }
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });
}
