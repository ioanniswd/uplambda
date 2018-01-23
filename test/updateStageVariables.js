"use strict";

var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

var updateStageVariables = require('../updateStageVariables');
var fs = require('fs');

describe('Update stage variables module', function() {

  it('updates stage variables succesfully', function() {
    return expect(updateStageVariables('uplambda', 'versionAlias', {
      apiId: 'qx8ef5d6mb',
      stageNames: [
        'prod',
        'prodNew'
      ]
    })).to.eventually.be.an('array');
  });
});
