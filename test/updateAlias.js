"use strict";

var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

var updateAlias = require('../updateAlias');

describe('Update alias module', function() {

  it('updates an existing alias', function() {
    return expect(updateAlias('helloClaudia', 'prod', 1)).to.eventually.be.an('object');
  });

  // need to update with a non-existing alias for every test
  it('creates a non-existing alias', function() {
    return expect(updateAlias('helloClaudia', 'nonExistent7', 3, {
      apiId: 'qx8ef5d6mb'
    })).to.eventually.be.an('object');
  });

});
