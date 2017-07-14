var expect = require('chai').expect;
var getFunctionName = require('../getFunctionName');

describe('Get function name module', function() {
  it('return valid string of at least 2 characters', function() {
    getFunctionName(function(err, functionName) {
      expect(err).to.be.a('null');
      expect(functionName).to.be.a('string');
      expect(functionName).to.have.lengthOf.at.least(2);
    });
  });
});
