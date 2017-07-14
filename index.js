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

console.log('runs');

console.log('homedir: ', homedir);

var args = minimist(process.argv.slice(2), {
  boolean: ['logs']
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

    ncp(invokeFolder, process.cwd(), function(err, files) {
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

            exec(`zip -FSr ${functionName}.zip .`, function(err, stdout, stderr) {
              if (err) {
                console.log(err);
              } else if (stderr) {
                console.log('stderr: ', stderr);
              } else {
                console.log(stdout);
                console.log('Zip done.');
                exec(`aws lambda  update-function-code --function-name ${functionName}  --zip-file fileb://${functionName}.zip`, function(err, stdout, stderr) {
                  if (err) {
                    console.log(err);
                  } else if (stderr) {
                    console.log('stderr ', stderr);
                  } else {
                    console.log('Upload done.');
                    if (args.version) {

                      // publish new version (keep version number)
                      publishVersion(functionName, function(err, version) {
                        if (err) {
                          console.log(err);
                        } else {

                          // this is the version that was published
                          console.log(`Version: ${version}`);

                          // update alias or create it if it does not exist
                          // args.version is the alias given by user (--version prod)
                          updateAlias(functionName, args.version, version, function(err, version) {

                            if (err) {
                              console.log(err);
                            } else {
                              // update api stage variables (apiId?, stage?)
                              updateStageVariables(functionName, args.version, function(err) {
                                if (err) {
                                  console.log(err);
                                } else {
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
