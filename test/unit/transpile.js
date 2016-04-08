'use strict'

const expect = require('expect.js')
const transpile = require('../../lib/transpile')

describe('transpile', function(){
  const wpContext = {
    path: 'the_loader_path'
  }

  function doTranspile(code, options, filename, relativeFileName) {
    const targetOptions = {
      sourceRoot: process.cwd(),
      filename: filename || 'foo.rb',
      relativeFileName: relativeFileName || 'foo.rb',
    }
    Object.assign(targetOptions, options)
    return transpile(code, targetOptions, wpContext).code
  }

  it('compiles an endpoint', function() {
    var result = doTranspile('HELLO=123')
    expect(result).to.match(/Opal.cdecl\(\$scope, 'HELLO', 123\)/)
    expect(result).to.not.match(/Opal.modules/)
  })

  describe('webpack requires', function() {
    it('standard', function() {
      var result = doTranspile('require "another_dependency"')
      expect(result).to.match(/require\('!!the_loader_path\?file=another_dependency&requirable=true!.*\/test\/fixtures\/another_dependency\.rb'\);/)
    })

    it('node convention', function() {
      var result = doTranspile('require "./another_dependency"')
      expect(result).to.match(/require\('!!the_loader_path\?file=\.%2Fanother_dependency&requirable=true!.*\/test\/fixtures\/another_dependency\.rb'\);/)
    })

    it('JS require', function() {
      var result = doTranspile('require "pure_js"')
      expect(result).to.match(/require\('imports!.*test\/fixtures\/pure_js.js'\);/)
    })
  })

  describe('stubbed module declarations', function() {
    it('via require', function() {
      const options = {
        stubs: ['stubbed']
      }
      var result = doTranspile('require "stubbed"; HELLO=123', options)

      expect(result).to.match(/Opal.cdecl\(\$scope, 'HELLO', 123\)/)
      expect(result).to.match(/Opal.modules\["stubbed"\]/)
    })

    it('via require_relative', function() {
      const options = {
        stubs: ['stubbed']
      }
      var result = doTranspile('require_relative "stubbed"; HELLO=123', options)

      expect(result).to.match(/Opal.cdecl\(\$scope, 'HELLO', 123\)/)
      expect(result).to.match(/Opal.modules\["stubbed"\]/)
    })

    it('via node conventions', function() {
      const options = {
        stubs: ['stubbed']
      }

      var result = doTranspile('require "./stubbed"; HELLO=123', options)

      expect(result).to.match(/Opal.cdecl\(\$scope, 'HELLO', 123\)/)
      expect(result).to.match(/Opal.modules\["stubbed"\]/)
    })
  })

  it('Opal require statements', function() {
    var result = doTranspile('require "another_dependency"')
    expect(result).to.match(/self.\$require\("another_dependency"\)/)
  })

  it('passes on requirable', function() {
    var result = doTranspile('HELLO=123', {requirable: true}, '/stuff/foo.rb', 'foo.rb')

    expect(result).to.match(/Opal.cdecl\(\$scope, 'HELLO', 123\)/)
    expect(result).to.match(/Opal.modules\["foo"\]/)
  })

  it('passes on compile options', function() {
    var result = doTranspile('HELLO=123', {arity_check: true})

    expect(result).to.match(/OPAL_CONFIG.*arity_check: true/)
  })
})
