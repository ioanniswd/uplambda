"use strict";

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const getStageVariable = require('../getStageVariable');
const homedir = require('os').homedir();
const fs = require('fs');

describe('Get Stage Variables module', function() {
  this.timeout(5000);

  let account;

  before(function() {
    const tmp_accounts = JSON.parse(fs.readFileSync(homedir + '/.uplambda.json', 'utf-8'));
    account = tmp_accounts.test_account.account;
  });

  it('returns dev as stage variable', function() {
    return expect(getStageVariable('7q0dbitueg', 'saveCard', account)).to.eventually.equal('dev');
  });
});
