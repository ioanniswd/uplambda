#!/usr/bin/env node

var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var path = require('path');
var fs = require('fs');
var homedir = require('os').homedir() + '/';
var zlib = require('zlib');
var ncp = require('ncp').ncp;

console.log('runs');

console.log('homedir: ', homedir);

var logs = process.argv[2] == 'logs';

console.log('logs: ', logs);

var localPath = 'localLambdas/';

var invokeFolder = process.cwd();
console.log('current directory: ', invokeFolder);

if (invokeFolder.indexOf('lambdafns') == -1) {
  console.log('You are in the wrong folder');
} else {
  console.log('Correct folder');
  exec('echo ${PWD##*lambdafns/}', function(err, stdout, stderr) {
    if (err) {
      console.log(err);
    } else if (stderr) {
      console.log('stderr: ', stderr);
    } else {
      localPath += stdout.slice(0, -1);
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

        fs.createReadStream(invokeFolder + '/index.js').pipe(fs.createWriteStream('index.js'));
        fs.createReadStream(invokeFolder + '/package.json').pipe(fs.createWriteStream('package.json'));

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

              exec('zip -FSr ${PWD##*/}.zip .', function(err, stdout, stderr) {
                if (err) {
                  console.log(err);
                } else if (stderr) {
                  console.log('stderr: ', stderr);
                } else {
                  console.log(stdout);
                  console.log('Zip done.');
                  exec('aws lambda  update-function-code --function-name ${PWD##*/}  --zip-file fileb://${PWD##*/}.zip', function(err, stdout, stderr) {
                    if (err) {
                      console.log(err);
                    } else if (stderr) {
                      console.log('stderr ', stderr);
                    } else {
                      console.log('Upload done.');
                      if(logs) {
                        exec('awslogs get /aws/lambda/${PWD##*/} --watch').stdout.pipe(process.stdout);
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
}
