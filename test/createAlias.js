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

  before(function() {
    const tmp_accounts = JSON.parse(fs.readFileSync(homedir + '/.uplambda.json', 'utf-8'));
    account = tmp_accounts.test_account.account;
  });

  it('creates a non-existing alias succesfully', function() {
    return expect(createAlias('helloClaudia', 'a' + Date.now().toString(), 3, undefined, account)).to.eventually.equal(undefined);
  });

});
