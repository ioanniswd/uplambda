"use strict";

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const updateAlias = require('../updateAlias');

const fs = require('fs');
const homedir = require('os').homedir();

describe('Update alias module', function() {
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

  it('updates an existing alias', function() {
    return expect(updateAlias('helloClaudia', 'prod', 1, undefined, account, aws_config)).to.eventually.be.an('object');
  });

  it('creates a non-existing alias', function() {
    return expect(updateAlias('helloClaudia', 'a' + Date.now().toString(), 3, {
      apiId: 'qx8ef5d6mb'
    }, account, aws_config)).to.eventually.be.an('object');
  });

});
