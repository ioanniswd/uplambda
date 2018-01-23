"use strict";
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const verifyCorrectAlias = require('../verifyCorrectAlias');

// need to change package.json to test
describe('Verify Correct Alias', function() {
  it('returns true if branch name is the same as package.json alias attribute', function() {
    return expect(verifyCorrectAlias('master')).to.eventually.equal(true);
  });

  it('returns false if branch name is not the same as package.json alias attribute', function() {
    return expect(verifyCorrectAlias('other')).to.eventually.equal(false);
  });
});
