'use strict'

const expect = require('chai').expect
const getOpalStub = require('../../lib/getOpalStub')

describe('getOpalStub', function(){
  it('works', function() {
    var result = getOpalStub('some/path')

    expect(result).to.include('Opal.modules["some/path"]')
  })
})
