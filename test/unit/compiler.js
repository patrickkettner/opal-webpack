'use strict'

const assert = require('assert')
const Opal = require('../../lib/opal')

describe('Opal compiler', function(){
  it('should compile ruby source', function(){
    var compiler = Opal.Opal.Compiler.$new('puts "Howdy #{1+2}"')

    compiler.$compile()

    var result = compiler.$result()

    assert.equal(typeof result, 'string')
    assert.equal(result.length > 0, true)
  })
})
