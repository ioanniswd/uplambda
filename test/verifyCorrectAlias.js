"use strict";

const expect = require('chai').expect;
const verifyCorrectAlias = require('../verifyCorrectAlias');

// need to change package.json to test
describe('Verify Correct Alias', function() {
  it('returns true if branch name is the same as package.json alias attribute', function(done) {
    verifyCorrectAlias('master', function(err, verified) {
      expect(err).to.be.a('null');
      expect(verified).to.equal(true);
      done();
    });
  });

  it('returns false if branch name is not the same as package.json alias attribute', function(done) {
    verifyCorrectAlias('master', function(err, verified) {
      expect(err).to.be.a('null');
      expect(verified).to.equal(false);
      done();
    });
  });
});
