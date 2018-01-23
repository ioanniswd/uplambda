"use strict";

var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const createAlias = require('../createAlias');

describe('Create Alias module', function() {

  it('creates a non-existing alias succesfully', function() {
    return expect(createAlias('uplambda', 'nonExistent3', 3)).to.eventually.be.an('object');
  });

});
