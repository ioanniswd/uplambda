"use strict";

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const getStageVariable = require('../getStageVariable');
const homedir = require('os').homedir();
const fs = require('fs');

describe('Get Stage Variables module', function() {
  this.timeout(15000);

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

  it('returns dev as stage variable', function() {
    return expect(getStageVariable('08zgeit8mg', 'test_uplambda_function', account, aws_config)).to.eventually.equal('dev');
  });
});
