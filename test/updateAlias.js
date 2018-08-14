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

  before(function() {
    const tmp_accounts = JSON.parse(fs.readFileSync(homedir + '/.uplambda.json', 'utf-8'));
    account = tmp_accounts.test_account.account;
  });

  it('updates an existing alias', function() {
    return expect(updateAlias('helloClaudia', 'prod', 1, undefined, account)).to.eventually.be.an('object');
  });

  it('creates a non-existing alias', function() {
    return expect(updateAlias('helloClaudia', 'a' + Date.now().toString(), 3, {
      apiId: 'qx8ef5d6mb'
    }, account)).to.eventually.be.an('object');
  });

});
