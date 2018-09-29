"use strict";

const expect = require('chai').expect;
const get_stack_name = require('../lib/get_stack_name');

describe('get_stack_name module returns camel case for', function() {
  it('with spaces', function() {
    expect(get_stack_name('with spaces')).to.equal('WithSpaces');
  });

  it('with underscores', function() {
    expect(get_stack_name('with__underscores')).to.equal('WithUnderscores');
  });

  it(' _ with_  __ all  _ ', function() {
    expect(get_stack_name(' _ with_  __ all  _ ')).to.equal('WithAll');
  });
});
