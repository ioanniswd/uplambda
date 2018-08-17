"use strict";

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const checkLambdaPolicy = require('../checkLambdaPolicy');

const fs = require('fs');
const homedir = require('os').homedir();

describe('checkLambdaPolicy', function() {
  let account;
  let aws_config;

  before(function() {
    const tmp_accounts = JSON.parse(fs.readFileSync(homedir + '/.uplambda.json', 'utf-8'));
    account = tmp_accounts.test_account.account;
    aws_config = {
      accessKeyId: tmp_accounts.test_account.aws_access_key_id,
      secretAccessKey: tmp_accounts.test_account.aws_secret_access_key,
      region: account.match(/^(.+):/)[1]
    };
  });


  it('returns true for existing policy', function() {
    return expect(checkLambdaPolicy('hello', 'production', {
      apiId: '08zgeit8mg',
      stageNames: [
        'production'
      ]
    }, account, aws_config)).to.eventually.equal(true);
  });

  it('returns false for non existent policy', function() {
    return expect(checkLambdaPolicy('hello', 'production', {
      apiId: 'dt4vx1d6na',
      stageNames: [
        'production'
      ]
    }, account, aws_config)).to.eventually.equal(false);
  });
});
