"use strict";

var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const AWS = require('aws-sdk');
AWS.config.update({
  region: 'eu-west-1'
});
const lambda = new AWS.Lambda();


var publishVersion = require('../publishVersion');

describe('Publish Version module', function() {
  var functionName = 'helloClaudia';
  var last_version = 0;

  before(function(done) {
    lambda.listVersionsByFunction({
      FunctionName: functionName,
      MaxItems: 1000
    }, (err, data) => {
      if (err) done(err);
      else {
        // console.log('data:', data);
        last_version = data.Versions[data.Versions.length - 1].Version;
        // console.log('last_version:', last_version);
        done();
      }
    });
  });

  it('returns valid version from request', function() {
    // normally the next version is returned, unless no changes have been made
    return expect(publishVersion('helloClaudia')).to.eventually.equal(last_version);
  });
});
