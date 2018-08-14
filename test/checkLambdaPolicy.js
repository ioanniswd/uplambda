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
  before(function(done) {
    fs.readFile(homedir + '/.uplambda', 'utf-8', function(err, data) {
      if (err) done(err);
      else {
        account = JSON.parse(data).account;
        done();
      }
    });
  });

  it('returns true for existing policy', function() {
    return expect(checkLambdaPolicy('update_viber_status_from_q', 'dev', {
      stageNames: [
        'prod',
        'prodNew'
      ]
    }, account)).to.eventually.equal(true);
  });

  it('returns false for non existent policy', function() {
    return expect(checkLambdaPolicy('update_viber_status_from_q', 'dev', {
      apiId: 'qx8ef5d6mb',
      stageNames: [
        'prod',
        'prodNew'
      ]
    }, account)).to.eventually.equal(false);
  });
});
