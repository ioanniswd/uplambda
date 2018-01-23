"use strict";

var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

var getFunctionName = require('../getFunctionName');

describe('Get function name module', function() {
  it('return valid string of at least 2 characters', function() {
    return expect(getFunctionName()).to.eventually.equal('uplambda');
  });
});
