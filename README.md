# Uplambda

CLI tool to upload code to an AWS Lambda Function and handle AWS API Gateway and permissions

## Installation

`npm install -g uplambda`

### Prerequisites

A config file is required, .uplambda.json in the home directory. Run "uplambda --accounts --add" to init.

[git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git): The name of the current branch is used to verify that package.json API Gateway parameters are valid. More details can be found later on.

[aws-cli](https://github.com/aws/aws-cli): Only config and credentials files are required, but installing the aws-cli to initialize them is easier.

[awslogs](https://github.com/jorgebastida/awslogs): Used with logs.

A role with permissions for AWS Lambda and API Gateway to be able to update lambda code and version, and update API Gateway permissions and stage variables.

## Conventions

There are certain attributes in package.json that are required to handle versions and permissions. If not found, they are initialized as empty when running `uplambda`. When running `uplambda` (uploading to `$LATEST`/`dev`) those attributes are not required, but no permissions will be added if `api` attribute is not found or empty.

The name of the current branch must be the same as `lambdaAlias` attribute found in package.json. If uploading to `$LATEST`/`dev`(no `--uplambda`) only a warning appears. If publishing to a version, the upload fails.

Each Lambda Function is linked to an API Gateway api resource. Resource name must be equal to Lambda Function name toLowerCase.

If lambda version being invoked is `$LATEST`, `--publish` is not needed. Simply run `uplambda`. No permissions are required either. When uploading to `$LATEST`, alias `dev` is created, if not found, and
assigned to `$LATEST`.

If lambda version being invoked is a published version with an alias(even `dev` which references `$LATEST`), api info in package.json is required. The Lambda Function name in API Gateway method should have the following format: `lambda_function_name:${stageVariables.lambda_function_name}`. This way, only the stage variable needs to change for each stage, and api can be deployed to multiple stages.

## Examples

### --accounts

`uplambda --accounts --add` Creates/Updates an account and inits .uplambda.json file, if not found.

`uplambda --accounts --delete account_alias` Deletes an existing account from the configuration file. If the account is not found, returns an error.

`uplambda --accounts --list` Lists all accounts.

`uplambda --accounts --use account_alias` Deactivates all other accounts and activates account_alias

### Usage

`uplambda` Uploads code to AWS Lambda Function ($LATEST) with name the name in package.json. If AWS API Gateway parameters are found, updates policy for API resource with same name as the Lambda Function(toLowerCase). If no API parameters are found, inits empty API parameters in package.json.

`uplambda --logs` Uploads as usual and streams Lambda Function logs to the console using aws cli.

`uplambda --publish` Uploads and publishes according to parameters in package.json. Updates API Gateway permissions accordingly. Example of filled API Gateway parameters can be found later on.

`uplambda --s3 [--publish]` Uploads through s3. A bucket and a lambda function are required to handle trigger and updates that are usually performed directly. Lambda Function will soon be uploaded as a different repo.

### AWS API Gateway parameters

    {
      "name": "lambda_function_name",
      "version": "4.2.2",
      "description": "",
      "scripts": {
        "test": "./node_modules/.bin/mocha --reporter spec"
      },
      "author": "",
      "license": "ISC",
      "dependencies": {
        "aws-sdk": "2.186.0"
      },
      "api": {
        "apiId": "4r7z01q51bg", <- API Gateway api id (found in a parenthesis after api name in API Gateway panel).
        "stageNames": [
          "testing" <- API Gateway stage names where there is a resource invoking the function
        ],
        "method": "POST" <- Resource method which invokes the function
      },
      "lambdaAlias": "production",  <- Used to make sure we are in the right branch. Also used as alias for lambda function version.
    }

When running `uplambda`, code is uploaded to `$LATEST` and permission are updated for lambda alias `dev`, which is used as an alias for `$LATEST` version. No API Gateway stage variables are updated.

When running `uplambda --publish`, code is uploaded to `$LATEST`, a new Lambda Function version is published and `lambdaAlias`(which must be the same as the current branch name) is used to create/update an alias for that version. Permissions are updated accordingly for API Gateway resource method which invokes lambda function. An API Gateway stage variable with Name the Lambda Function name is created/updated to have value the same as `lambdaAlias`.
