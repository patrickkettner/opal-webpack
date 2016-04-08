'use strict'

const expect = require('expect.js')
const getJsRequire = require('../../lib/getJsRequire')

describe('getJsRequire', function(){
  it('works', function() {
    var result = getJsRequire('foo', 'lib/foo')

    expect(result.length).to.be(2)
    expect(result[0]).to.match(/require\('imports!lib\/foo'\);/)
    expect(result[1]).to.be('Opal.loaded(\'foo\');')
  })
})
