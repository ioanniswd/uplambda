var expect = require('chai').expect;
var publishVersion = require('../publishVersion');

describe('Publish Version module', function () {
  it('returns valid version from request', function(done) {
    publishVersion('helloClaudia', function(err, version) {
      expect(err).to.be.a('null');
      expect(version).to.be.a('number');
      done();
    });
  });
});
