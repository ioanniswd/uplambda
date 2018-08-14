"use strict";

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const checkLambdaPolicy = require('../checkLambdaPolicy');

describe('checkLambdaPolicy', function() {

  it('returns true for existing policy', function() {
    return expect(checkLambdaPolicy('update_viber_status_from_q', 'dev', {
      stageNames: [
        'prod',
        'prodNew'
      ]
    })).to.eventually.equal(true);
  });

  it('returns false for non existent policy', function() {
    return expect(checkLambdaPolicy('update_viber_status_from_q', 'dev', {
      apiId: 'qx8ef5d6mb',
      stageNames: [
        'prod',
        'prodNew'
      ]
    })).to.eventually.equal(false);
  });
});
