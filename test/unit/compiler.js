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

  it('passes on compiler options')

context('requireable', function (done) {
    it('standard', function(done) {
      const callback = function (err, result) {
        expect(result).to.match(/Opal.cdecl\(\$scope, 'HELLO', 123\)/)
        expect(result).to.match(/Opal.modules\["dependency"\]/)
        done()
      }

      const queryOptions = {
        requirable: true
      }

      callLoader(callback, 'HELLO=123', queryOptions)
    })

    it('require_relative', function(done) {
      const callback = function (err, result) {
        expect(result).to.match(/Opal.cdecl\(\$scope, 'HELLO', 123\)/)
        expect(result).to.match(/Opal.modules\["dependency\/foo"\]/)
        done()
      }

      const queryOptions = {
        requirable: true,
        file: 'dependency/foo'
      }

      callLoader(callback, 'HELLO=123', queryOptions)
    })

    it('node conventions', function(done) {
      const callback = function (err, result) {
        expect(result).to.match(/Opal.cdecl\(\$scope, 'HELLO', 123\)/)
        expect(result).to.match(/Opal.modules\["dependency"\]/)
        done()
      }

      const queryOptions = {
        requirable: true,
        file: './dependency'
      }

      callLoader(callback, 'HELLO=123', queryOptions)
    })
  })


  describe('Opal requires', function() {

  it('node conventions', function (done) {
      const callback = function (err, result) {
        expect(result).to.match(/self.\$require\("a_file"\)/)
        done()
      }

      const options = {
        opal: {
          stubs: ['a_file']
        }
      }

      callLoader(callback, 'require "./a_file"', null, options)
    })

    it('standard require', function (done) {
      const callback = function (err, result) {
        expect(result).to.match(/self.\$require\("a_file"\)/)
        done()
      }

      const options = {
        opal: {
          stubs: ['a_file']
        }
      }

      callLoader(callback, 'require "a_file"', null, options)
    })

    it('require relative', function (done) {
      const callback = function (err, result) {
        expect(result).to.match(/self.\$require\("dependency"+ '\/..\/' + "a_file"\)/)
        done()
      }

      const options = {
        opal: {
          stubs: ['a_file']
        }
      }

      callLoader(callback, 'require_relative "a_file"', null, options)
    })

    it('require relative with leading dot', function (done) {
      const callback = function (err, result) {
        expect(result).to.match(/self.\$require\("dependency"+ '\/..\/' + "\.\/a_file"\)/)
        done()
      }

      const options = {
        opal: {
          stubs: ['a_file']
        }
      }

      callLoader(callback, 'require_relative "./a_file"', null, options)
    })
  })
})
