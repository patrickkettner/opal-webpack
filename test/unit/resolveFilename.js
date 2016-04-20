'use strict'

const expect = require('chai').expect
const path = require('path')

const cleanScopeAndRequire = require('../support/cleanScopeAndRequire')

describe('resolveFilename', function(){
  beforeEach(cleanScopeAndRequire)

  function resolveFilename(filename) {
    const targetOptions = {
      file: filename
    }
    const compiler = require('../../lib/getCompiler')('', targetOptions)
    const func = require('../../lib/resolveFilename')
    return func(compiler, filename)
  }

  function bundlerResolve(filename) {
    process.env.OPAL_USE_BUNDLER = 'true'
    return resolveFilename(filename)
  }

  it('uses Bundler load paths if Bundler is running', function() {
    this.timeout(12000)

    const result = bundlerResolve('opal-browser')

    expect(result).to.match(/gems\/opal-browser-.*\/opal\/opal-browser\.rb/)
  })

  it('resolves a JS filename with a suffix including a dot', function() {
    const result = resolveFilename('js_file_with.suffix')

    expect(result).to.eq(path.resolve(__dirname, '../fixtures/js_file_with.suffix.js'))
  })

  it('resolves a Ruby filename with a suffix including a dot', function() {
    const result = resolveFilename('rb_file_with.suffix')

    expect(result).to.eq(path.resolve(__dirname, '../fixtures/rb_file_with.suffix.rb'))
  })

  it('resolves corelib/runtime as a JS file in Bundler mode', function() {
    this.timeout(12000)

    const result = bundlerResolve('corelib/runtime')

    expect(result).to.match(/gems\/opal.*corelib\/runtime.js/)
  })

  it('resolves the Opal runtime in non bundler mode', function() {
    const result = resolveFilename('opal')

    expect(result).to.eq(path.resolve(__dirname, '../../vendor/opal-runtime.js'))
  })

  it('resolves a test fixture', function() {
    const result = resolveFilename('arity_1')

    expect(result).to.eq(path.resolve(__dirname, '../fixtures/arity_1.rb'))
  })

  it('throws error if not found', function() {
    expect(function() { resolveFilename('not_found.rb')}).to.throw(/Cannot find file - not_found.rb in load path .*\/test\/fixtures.*\/test\/fixtures\/load_path/)
  })
})
