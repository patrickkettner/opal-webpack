'use strict'

const expect = require('expect.js')
const Opal = require('../../lib/opal')
const getCompiler = require('../../lib/getCompiler')

describe('compiler', function(){
  function doCompile(relativeFileName, source, options) {
    const targetOptions = {
      relativeFileName: relativeFileName
    }
    Object.assign(targetOptions, options)
    const compiler = getCompiler(source, targetOptions)
    compiler.$compile()
    return compiler.$result()
  }

  it('raw compiler works', function(){
    var result = doCompile('foo', 'puts "Howdy #{1+2}"')

    expect(result).to.match(/self.\$puts\("Howdy " \+ \(\$rb_plus\(1, 2\)\)\)\n}\)/)
  })

  it('passes on compiler options', function() {
    var result = doCompile('foo', 'HELLO=123', {arity_check: true})

    expect(result).to.match(/OPAL_CONFIG.*arity_check: true/)
  })

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
