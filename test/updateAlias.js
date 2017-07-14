var expect = require('chai').expect;
var updateAlias = require('../updateAlias');


describe('Update alias module', function() {

  it('updates an existing alias', function(done) {
    var alias = 'nonExistent1';
    updateAlias('uplambda', alias, 1, function(err, version, name) {
      expect(err).to.be.a('null');
      expect(version).to.be.a('number');
      expect(name).to.equal(alias);
      done();
    });
  });

  it('creates a non-existing alias', function(done) {
    var alias = 'nonExistent3';
    var version = 3;
    updateAlias('uplambda', alias, version, function(err, version) {
      expect(err).to.be.a('null');
      expect(version).to.be.a('number');
      done();
    });
  });

});
