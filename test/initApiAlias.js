"use strict";

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const initApiAlias = require('../initApiAlias');

describe('Init Api Info and Alias module', function() {
  it('returns no error', function() {
    return expect(initApiAlias()).to.eventually.equal('success');
  });
});
