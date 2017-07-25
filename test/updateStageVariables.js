var expect = require('chai').expect;
var updateStageVariables = require('../updateStageVariables');
var fs = require('fs');

describe('Update stage variables module', function() {

  it('updates stage variables succesfully', function(done) {
    fs.readFile('../package.json', 'utf-8', function(err, data) {
      // updateStageVariables(functionName, versionAlias)
      updateStageVariables('uplambda', 'versionAlias', function(err) {
        expect(err).to.be.a('null');
        done();
      });
    });
  });
});
