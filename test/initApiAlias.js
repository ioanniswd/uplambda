"use strict";

const expect = require('chai').expect;
const initApiAlias = require('../initApiAlias');

var err;

describe('Init Api Info and Alias module', function() {
  before(function(done) {
    initApiAlias(function(_err) {
      err = _err;
      done();
    });
  });

  it('returns no Error', function() {
    expect(err).to.be.a('null');
  });
});
