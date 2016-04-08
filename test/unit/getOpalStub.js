'use strict'

const expect = require('expect.js')
const getOpalStub = require('../../lib/getOpalStub')

describe('getOpalStub', function(){
  it('works', function() {
    var result = getOpalStub('some/path')

    expect(result).to.match(/Opal.modules\["some\/path"\]/)
  })
})
