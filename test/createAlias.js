"use strict";

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const createAlias = require('../createAlias');

const homedir = require('os').homedir();
const fs = require('fs');

describe('Create Alias module', function() {
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


  it('creates a non-existing alias succesfully', function() {
    return expect(createAlias('test_uplambda_function', 'a' + Date.now().toString(), 1, undefined, account, aws_config)).to.eventually.equal(undefined);
  });

});
