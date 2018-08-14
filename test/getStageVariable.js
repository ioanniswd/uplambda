"use strict";

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const getStageVariable = require('../getStageVariable');

describe('Get Stage Variables module', function() {
  it('returns dev as stage variable', function() {
    return expect(getStageVariable('7q0dbitueg', 'saveCard')).to.eventually.equal('prodv4_6');
  });
});
