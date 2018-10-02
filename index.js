#!/usr/bin/env node

"use strict";

const AWS = require('aws-sdk');

const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');
const homedir = require('os').homedir();
const minimist = require('minimist');
const colors = require('colors/safe');
const JSZip = require("jszip");
const _ = require('lodash');
const prompt = require('prompt-promise');

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
const checkLambdaPolicy = require('./checkLambdaPolicy');
const get_stack_name = require('./lib/get_stack_name');

/**
 * Uploads lambda to AWS and updates API GW stage variables and permission
 * @module Uplambda
 */

let alias;
let otherBranches;
let functionName;
let api_info;

// used with cloudformation
let private_params = [];

const args = minimist(process.argv.slice(2), {
  boolean: ['logs', 'v', 'version', 's3', 'publish', 'f', 'force', 'account']
});

const localPath = 'localLambdas/';

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
      fs.readFile(homedir + '/.uplambda.json', 'utf-8', function(err, data) {
        if (err) {
          if (err.code != 'ENOENT') reject(err);
          else if (args.account && args.add) resolve({});
          else reject(`Config file ${homedir}/.uplambda.json was not found. Run "uplambda --account --add" to init`);
        } else resolve(JSON.parse(data));
      });
    }).then(config => {
      let account;
      let bucket;
      let cloudformation_bucket;
      let lambda_role;
      let s3_prefix;
      let aws_access_key_id;
      let aws_secret_access_key;

      const tmp_accounts = _.filter(config, {
        active: true
      });

      if (args.account && !args.use) {
        if (!args.add && !args.delete && !args.list) return Promise.reject('When updating accounts, use --add to add/update account, and --delete to delete an account');
        if (args.list) {
          console.log('Accounts:\n' + JSON.stringify(config, null, 2));
          return Promise.resolve();

        } else if (args.delete) {
          if (!config[args.delete]) return Promise.reject(`Account: "${args.delete === true ? undefined : args.delete}" not found`);
          else {
            delete config[args.delete];
            return fs.writeFileSync(homedir + '/.uplambda.json', JSON.stringify(config, null, 2));
          }

        } else {
          let account_name;

          return prompt('account alias/name(any name, no spaces. e.g. my_project_account): ')
            .then(res => {
              if (!res || !res.match(/^\w+$/)) return Promise.reject('Invalid account name. Must satisfy /^\\w+$/');

              account_name = res;

              if (!config[account_name]) {
                config[account_name] = {
                  account: '',
                  active: false,
                  bucket: '',
                  s3_prefix: '',
                  cloudformation_bucket: '',
                  lambda_role: '',
                  aws_access_key_id: '',
                  aws_secret_access_key: ''
                };
              }

              return prompt('account arn(region:account_number, e.g. eu-west-1:1234567890): ');
            })
            .then(res => {
              if (!config[account_name].account && (!res || !res.match(/^[a-z]{2}-[a-z0-9]+-\d{1,2}:\d+$/))) return Promise.reject('Invalid account arn, must match /^[a-z]{2}-[a-z0-9]+-\\d{1, 2}:\\d+$/.');

              if (res) config[account_name].account = res;
              return prompt('aws_access_key_id: ');
            })
            .then(res => {
              if (!config[account_name].aws_access_key_id && !res) return Promise.reject('Invalid aws_access_key_id');

              if (res) config[account_name].aws_access_key_id = res;
              return prompt('aws_secret_access_key: ');
            })
            .then(res => {
              if (!config[account_name].aws_secret_access_key && !res) return Promise.reject('Invalid aws_secret_access_key');

              if (res) config[account_name].aws_secret_access_key = res;
              return prompt('set account as active?(y/n): ');
            })
            .then(res => {

              if (res && res[0].toLowerCase() === 'y') {
                _.each(tmp_accounts, item => {
                  item.active = false;
                });

                config[account_name].active = true;
              }

              return prompt('S3 bucket used with updates via S3 (Optional): ');
            })
            .then(res => {
              if (res) config[account_name].bucket = res;

              return prompt('Set S3 item prefix (Optional): ');
            })
            .then(res => {
              if (res) {
                if (res[res.length - 1] !== '/') res += '/';
                config[account_name].s3_prefix = res;

              } else config[account_name].s3_prefix = '';

              return prompt('Set S3 bucket used with cloudformation templates to update lambda code (Optional): ');
            })
            .then(res => {
              if (res) config[account_name].cloudformation_bucket = res;

              return prompt('Set lambda IAM role name (Optional, used with cloudformation): ');
            })
            .then(res => {
              if (res) config[account_name].lambda_role = res;

              return fs.writeFileSync(homedir + '/.uplambda.json', JSON.stringify(config, null, 2));
            });
        }

      } else if (args.use) {
        if (!config[args.use]) return Promise.reject(`Account: "${args.use}" not found. Run "uplambda --account --add"`);

        _.each(config, item => {
          item.active = false;
        });

        config[args.use].active = true;

        fs.writeFileSync(homedir + '/.uplambda.json', JSON.stringify(config, null, 2));

        console.log(`\nAccount "${args.use}" was activated`);
        return Promise.resolve();

      } else if (args.init) return initApiAlias();
      else {
        let stack;

        const package_json = JSON.parse(fs.readFileSync(process.cwd() + '/package.json', 'utf-8'));

        if (tmp_accounts.length === 0) return Promise.reject(`Invalid ${homedir}/.uplambda.json. At least one account must be active at a time. Run "uplambda --account --use <your_account_alias>" to choose which account to enable`);
        if (tmp_accounts.length !== 1) return Promise.reject(`Invalid ${homedir}/.uplambda.json. Only one account can be active at a time. Run "uplambda --account --use <your_account_alias>" to choose which account to enable`);
        else {
          account = tmp_accounts[0].account;
          bucket = tmp_accounts[0].bucket;
          cloudformation_bucket = tmp_accounts[0].cloudformation_bucket;
          lambda_role = package_json.lambda_role || tmp_accounts[0].lambda_role;
          s3_prefix = tmp_accounts[0].s3_prefix;
          aws_access_key_id = tmp_accounts[0].aws_access_key_id;
          aws_secret_access_key = tmp_accounts[0].aws_secret_access_key;
        }

        const aws_config = {
          accessKeyId: aws_access_key_id,
          secretAccessKey: aws_secret_access_key,
          region: account.match(/^(.+):/)[1]
        };

        const lambda = new AWS.Lambda(aws_config);

        return new Promise(function(resolve, reject) {
            // check js files for deps
            depcheck(process.cwd(), {}, unused => {
              try {
                // console.log('unused:', unused);
                const deps = Object.keys(unused.missing).filter(dep => dep !== 'aws-sdk' && dep !== 'popper.js');
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
            if (package_json.dependencies) {

              return Promise.all(Object.keys(package_json.dependencies).map(dep => {
                try {
                  console.log('dep:', dep);
                  if (dep == 'aws-sdk') return Promise.resolve();
                  else return require.resolve(process.cwd() + '/node_modules/' + dep);

                } catch (err) {
                  return Promise.reject('Cannot find module: ' + dep);
                }
              }));

            } else return Promise.resolve();
          })
          // check if required files are in the folder
          .then(() => {
            if (!package_json.files) return Promise.resolve();
            else {
              const missing = _.find(package_json.files, filename => !fs.existsSync(path.join(process.cwd(), filename)));
              return missing ? Promise.reject(`File: ${missing} is missing`) : Promise.resolve();
            }
          })
          // update packages
          .then(() => {
            return new Promise(function(resolve, reject) {
              exec('npm update --no-save', (err, stderr) => {
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
            // getting stack.json before changing cwd
            if (fs.existsSync('cloudformation') && fs.existsSync('cloudformation/stack.json')) stack = fs.readFileSync('cloudformation/stack.json', 'utf-8');

            try {
              private_params = JSON.parse(fs.readFileSync('cloudformation/params.json'));
            } catch (e) {
              if (e.code !== 'ENOENT') throw e;
            }

            process.chdir(`${homedir}/${localPath}`);
            return new JSZip.external.Promise(function(resolve, reject) {
              fs.readFile(`${functionName}.zip`, function(err, data) {
                if (err) reject(err);
                else resolve(data);
              });
            });
          })
          .then(zip => {

            // TODO: add api info
            if (args.cloudformation) {
              const cf = new AWS.CloudFormation(aws_config);

              const stack_name = `Lambda${get_stack_name(functionName)}`;

              const stack_params = {
                StackName: stack_name,
                TemplateBody: stack,
                Parameters: private_params.concat([{
                    ParameterKey: 'LambdaFunctionName',
                    ParameterValue: functionName
                  },
                  {
                    ParameterKey: 'S3Bucket',
                    ParameterValue: cloudformation_bucket
                  },
                  {
                    ParameterKey: 'S3Key',
                    ParameterValue: `${functionName}.zip`
                  },
                  {
                    ParameterKey: 'Role',
                    ParameterValue: `arn:aws:iam::${account.match(/:(\w+)$/)[1]}:role/${lambda_role}`
                  }
                ])
              };
              // console.log('stack_params:', stack_params);

              if (!package_json.no_api) {
                if (!api_info.apiId || !api_info.method || !api_info.RootResourceId) throw Error('Invalid api info in package.json.');
                stack_params.Parameters.push(...[{
                    ParameterKey: "RestApiId",
                    ParameterValue: api_info.apiId
                  }, {
                    ParameterKey: "APIGatewayResourcePath",
                    ParameterValue: functionName.toLowerCase()
                  }, {
                    ParameterKey: "APIMethod",
                    ParameterValue: api_info.method
                  }, {
                    ParameterKey: "AWSRegion",
                    ParameterValue: account.match(/^(.+):/)[1]
                  },
                  {
                    ParameterKey: "RootResourceId",
                    ParameterValue: api_info.RootResourceId
                  },
                  {
                    ParameterKey: 'AccountId',
                    ParameterValue: account.match(/:(\w+)$/)[1]
                  }
                ]);
              }

              console.log('stack_params:', stack_params);

              console.log('Uploading with cloudformation');
              return uploadS3(functionName, zip, null, null, account, cloudformation_bucket, '', aws_config)
                .then(() => cf.createStack(stack_params).promise())
                .then(() => cf.waitFor('stackCreateComplete', {
                  StackName: stack_name
                }).promise())
                .catch(err => err.code === 'AlreadyExistsException' ? cf.updateStack(stack_params).promise()
                  .then(() => cf.waitFor('stackUpdateComplete', {
                    StackName: stack_name
                  }).promise()) : Promise.reject(err));


            } else if (args.s3) {
              console.log(`Uploading ${args.publish ? alias : '$LATEST'} to s3..`);
              if (!args.publish && !package_json.no_api) return uploadS3(functionName, zip, null, null, account, bucket, s3_prefix, aws_config);
              else {
                console.log('info.apiId: ', api_info.apiId);
                console.log('info.stageNames: ', api_info.stageNames);
                console.log('info.method:', api_info.method);

                return uploadS3(functionName, zip, alias, api_info, account, bucket, s3_prefix, aws_config);
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
                  const version = res.Version;
                  // console.log(`Version: ${version}`);

                  if (args.publish) {
                    if ((!api_info || !api_info.apiId || !api_info.method || !api_info.stageNames || api_info.stageNames.length === 0 || !alias) && !package_json.no_api) return Promise.reject('Invalid api/alias info');
                    else {
                      // console.log('info.apiId: ', api_info.apiId);
                      // console.log('info.stageNames: ', api_info.stageNames);
                      // console.log('info.method:', api_info.method);

                      return updateAlias(functionName, alias, version, api_info, account, aws_config)
                        .then(() => package_json.no_api ? Promise.resolve() : updateStageVariables(functionName, alias, api_info, account, aws_config))
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
                  } else return updateAlias(functionName, 'dev', '$LATEST', api_info, account, aws_config)
                    .then(() => package_json.no_api ? Promise.resolve() : checkLambdaPolicy(functionName, 'dev', api_info, account, aws_config).then(found => found ? Promise.resolve() : updateAPIGWPolicy(functionName, 'dev', api_info, account, aws_config)));
                });
            }
          })
          // if uploading to $LATEST, check dev stage variable of api to confirm dev alias is invoked
          .then(() => {
            if (args.publish || !api_info.apiId) return Promise.resolve();
            else {
              return getStageVariable(api_info.apiId, functionName, account, aws_config)
                .then(stageVariable => {
                  if (stageVariable !== 'dev') {
                    console.log('\n' + colors.red(`Stage Variable in API GW Stage 'dev':${stageVariable}`));
                    console.log('\n' + colors.red(`For tests on front end, set Stage Variable with name '${functionName}' equal to 'dev' in API GW, stage 'dev'`));
                  } else console.log('\n' + colors.green(`Stage Variable in API GW Stage 'dev':${stageVariable}`));
                  return Promise.resolve();
                });
            }
          });
      }
    })
    .then(() => {
      console.log('\n' + colors.green('Success'));
      if (args.logs) exec(`awslogs get /aws/lambda/${functionName} --watch`).stdout.pipe(process.stdout);
      else process.exit();
    })
    .catch(err => {
      console.log(colors.red(err));
      process.exit(1);
    });

}
