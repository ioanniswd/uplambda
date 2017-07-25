var expect = require('chai').expect;
var createAlias = require('../createAlias');

describe('Create Alias module', function() {

  it('creates a non-existing alias succesfully', function(done) {
    createAlias('uplambda', 'nonExistent3', 3, function(err, version) {
      expect(err).to.be.a('null');
      expect(version).to.be.a('number');
      done();
    });
  });

});
