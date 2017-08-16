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
const npmInstallMissing = require('npm-install-missing');
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


/**
 * returnNotGit - Returns files and folders that are not .git
 *
 * @param  {type} fileName description
 * @return {type}          description
 */
function returnNotGit(fileName) {
  return fileName.indexOf('.git') == -1;
}

var args = minimist(process.argv.slice(2), {
  boolean: ['logs', 'v', 'version, s3, publish']
});

var localPath = 'localLambdas/';

var invokeFolder = process.cwd();

if (args.v || args.version) {
  exec('npm show uplambda version', function(err, stdout, stderr) {
    if (err) {
      throw err;

    } else {
      if (stderr) console.log(stderr);
      process.stdout.write('v' + stdout);
    }
  });
} else {

  console.log('current directory: ', invokeFolder);

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

                  localPath += functionName;
                  console.log('localPath: ', localPath);
                  process.chdir(homedir);
                  if (!fs.existsSync(localPath)) {
                    console.log('local path does not exist');
                    var dirs = localPath.split('/');
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

                    console.log('Removing unnecessary modules...');

                    exec('npm prune', function(err, stdout, stderr) {
                      if (err) {
                        console.log(colors.red(err));
                      } else {
                        console.log(colors.red('stderr: ', stderr));
                        console.log('Installing missing modules...');

                        npmInstallMissing.init(function(response) {
                          console.log("npm-install-missing " + response);
                          console.log('Executing zip...');
                          console.log('pwd: ', process.cwd());

                          exec(`zip -FSr ${functionName}.zip .`, {
                            maxBuffer: 1024 * 1024
                          }, function(err, stdout, stderr) {
                            if (err) {
                              console.log(colors.red(err));
                            } else if (stderr) {
                              console.log(colors.red('stderr: ', stderr));
                            } else {
                              console.log(stdout);
                              console.log('Zip done.');
                              if (args.s3) {
                                console.log('Uploading to s3..');
                                if (!args.publish) {
                                  uploadS3(functionName, null, function(err, res) {
                                    if (err) {
                                      throw err;
                                    } else {
                                      console.log(res);
                                      console.log('Done');
                                    }
                                  });

                                } else {
                                  uploadS3(functionName, alias, function(err, res) {
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
                                    let apiMethod;
                                    getApiInfo(function(err, apiInfo) {
                                      if (err) {
                                        console.log(colors.red(err));

                                      } else {
                                        if (!apiInfo.apiId) {
                                          console.log(colors.green('Not used by any API'));

                                        } else {
                                          apiMethod = apiInfo.method;
                                          if (!apiInfo.stageNames || apiInfo.stageNames.length === 0) {
                                            console.log(colors.green('Not used by any Stage'));

                                          } else {
                                            console.log(colors.blue('Used in stages:'));
                                            apiInfo.stageNames.forEach(function(stageName) {
                                              console.log(colors.cyan(stageName));
                                            });
                                          }
                                        }
                                      }
                                      if (args.publish) {

                                        if (!apiInfo || !apiInfo.apiId || !apiInfo.method || !apiInfo.stageNames || apiInfo.stageNames.length === 0 || !alias) {
                                          console.log(colors.red('Invalid api/alias info'));
                                          throw new Error('Invalid api/alias info');
                                        } else {

                                          // publish new version (keep version number)
                                          publishVersion(functionName, function(err, version) {
                                            if (err) {
                                              console.log(colors.red(err));
                                            } else {

                                              // this is the version that was published
                                              console.log(`Version: ${version}`);

                                              // update alias or create it if it does not exist
                                              updateAlias(functionName, alias, version, function(err, version) {

                                                if (err) {
                                                  console.log(colors.red(err));
                                                } else {
                                                  // update api stage variables (apiId, stageNames), if api info exists

                                                  updateStageVariables(functionName, alias, function(err) {
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
                                    });
                                  }
                                });
                              }
                            }
                          });
                        });
                      }
                    });
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
