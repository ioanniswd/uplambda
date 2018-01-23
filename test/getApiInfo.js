"use strict";

const expect = require('chai').expect;
const getApiInfo = require('../getApiInfo');
var apiInfo;

describe('Get Api Info Module', function() {

  before(function(done) {
    getApiInfo()
      .then(info => {
        apiInfo = info;
        done();
      })
      .catch(done);
  });

  it('returns an object', function() {
    expect(apiInfo).to.be.an('object');
  });

  it('shows correct api key', function() {
    expect(apiInfo.apiId).to.be.a('string');
    expect(apiInfo.apiId).to.equal('c8kn76s7j8');
  });

  it('show correct Stages', function() {
    expect(apiInfo.stageNames).to.be.an('array');
    expect(apiInfo.stageNames).to.deep.equal(['testing']);
  });

});
