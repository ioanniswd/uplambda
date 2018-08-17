"use strict";

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const updateStageVariables = require('../updateStageVariables');

const homedir = require('os').homedir();
const fs = require('fs');

describe('Update stage variables module', function() {
  this.timeout(10000);
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

  it('updates stage variables succesfully', function() {
    return expect(updateStageVariables('version_alias', Date.now().toString(), {
      apiId: '08zgeit8mg',
      stageNames: [
        'dev'
      ]
    }, account, aws_config)).to.eventually.equal(undefined);
  });
});
