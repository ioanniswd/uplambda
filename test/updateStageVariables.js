"use strict";

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const updateStageVariables = require('../updateStageVariables');

const homedir = require('os').homedir();
const fs = require('fs');

describe('Update stage variables module', function() {
  let account;

  before(function() {
    const tmp_accounts = JSON.parse(fs.readFileSync(homedir + '/.uplambda.json', 'utf-8'));
    account = tmp_accounts.test_account.account;
  });

  it('updates stage variables succesfully', function() {
    return expect(updateStageVariables('uplambda', 'versionAlias', {
      apiId: 'qx8ef5d6mb',
      stageNames: [
        'prod',
        'prodNew'
      ]
    }, account)).to.eventually.equal(undefined);
  });
});
