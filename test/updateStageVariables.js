"use strict";

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const updateStageVariables = require('../updateStageVariables');

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
