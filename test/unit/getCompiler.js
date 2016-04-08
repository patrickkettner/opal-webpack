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

  describe('Opal module declarations', function () {
    function doModuleCompile(filename) {
      return doCompile(filename, 'HELLO=123', {
        requirable: true,
        file: filename
      })
    }

    it('standard', function() {
      var result = doModuleCompile('dependency')

      expect(result).to.match(/Opal.modules\["dependency"\]/)
    })

    it('require_relative', function() {
      var result = doModuleCompile('dependency/foo')

      expect(result).to.match(/Opal.modules\["dependency\/foo"\]/)
    })

    it('node conventions', function() {
      var result = doModuleCompile('./dependency')

      expect(result).to.match(/Opal.modules\["dependency"\]/)
    })
  })

  describe('Opal requires', function() {
    function doRequireCompile(statement) {
      return doCompile('foo.rb', statement, {
        stubs: ['a_file']
      })
    }

    it('node conventions', function () {
      var result = doRequireCompile('require "./a_file"')

      expect(result).to.match(/self.\$require\("a_file"\)/)
    })

    it('standard require', function () {
      var result = doRequireCompile('require "a_file"')

      expect(result).to.match(/self.\$require\("a_file"\)/)
    })

    it('require relative', function () {
      var result = doRequireCompile('require_relative "a_file"')

      expect(result).to.match(/self.\$require\("foo"+ '\/..\/' + "a_file"\)/)
    })

    it('require relative with leading dot', function (done) {
      var result = doRequireCompile('require_relative "./a_file"')

      expect(result).to.match(/self.\$require\("foo"+ '\/..\/' + "\.\/a_file"\)/)
    })
  })
})
