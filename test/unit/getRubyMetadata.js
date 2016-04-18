'use strict'
/*jshint expr: true*/

const expect = require('chai').expect

const cleanScopeAndRequire = require('../support/cleanScopeAndRequire')

describe('getRubyMetadata', function(){
  beforeEach(cleanScopeAndRequire)
  const env = process.env

  function getRubyMetadata() {
    return require('../../lib/getRubyMetadata')
  }

  function bundlerGetMetadata() {
    env.OPAL_USE_BUNDLER = 'true'
    return getRubyMetadata()
  }

  function addSupportToMriLoadPath() {
    env.RUBYLIB = env.RUBYLIB + ':test/support'
  }

  it('Bundler is running', function() {
    this.timeout(12000)

    const result = bundlerGetMetadata()
    const loadPath = result.loadPath

    expect(loadPath).to.include.match(/gems\/opal.*\/opal/)
    expect(loadPath).to.include.match(/gems\/opal.*\/stdlib/)
    expect(loadPath).to.include.match(/gems\/opal.*\/lib/)
    expect(loadPath).to.include.match(/gems\/opal-browser\S+\/opal/)
    expect(loadPath).to.include('./test/fixtures')
    expect(loadPath).to.include('./test/fixtures/load_path')
    expect(result.stubs).to.be.empty
  })

  it('additional MRI requires', function() {
    env.OPAL_MRI_REQUIRES = 'additional_require'
    addSupportToMriLoadPath()

    const result = getRubyMetadata()
    const loadPath = result.loadPath

    expect(loadPath).to.include.match(/gems\/opal.*\/opal/)
    expect(loadPath).to.include.match(/gems\/opal.*\/stdlib/)
    expect(loadPath).to.include.match(/gems\/opal.*\/lib/)
    expect(loadPath).to.include('addtl')
    expect(loadPath).to.include('./test/fixtures')
    expect(loadPath).to.include('./test/fixtures/load_path')
    expect(result.stubs).to.have.length(1)
    expect(result.stubs[0]).to.eq('addtl_stub')
  })

  it('additional MRI requires with bundler', function() {
    env.OPAL_MRI_REQUIRES = 'additional_require'
    addSupportToMriLoadPath()

    const result = bundlerGetMetadata()
    const loadPath = result.loadPath

    expect(loadPath).to.include.match(/gems\/opal.*\/opal/)
    expect(loadPath).to.include.match(/gems\/opal.*\/stdlib/)
    expect(loadPath).to.include.match(/gems\/opal.*\/lib/)
    // from our Gemfile
    expect(loadPath).to.include.match(/gems\/opal-browser\S+\/opal/)
    expect(loadPath).to.include('addtl')
    expect(loadPath).to.include('./test/fixtures')
    expect(loadPath).to.include('./test/fixtures/load_path')
    expect(result.stubs).to.have.length(1)
    expect(result.stubs[0]).to.eq('addtl_stub')
  })

  it('Rails hook is listening', function() {
    env.RAILS_ENV = 'unexpected_env'

    expect(function() { bundlerGetMetadata()}).to.throw(/Command failed: rails runner/)
  })

  it('uses Rails load paths if Rails is running', function() {
    env.RAILS_ENV = 'foobar'

    const result = bundlerGetMetadata()
    const loadPath = result.loadPath

    expect(loadPath).to.include.match(/gems\/opal.*\/opal/)
    expect(loadPath).to.include.match(/gems\/opal.*\/stdlib/)
    expect(loadPath).to.include.match(/gems\/opal.*\/lib/)
    expect(loadPath).to.include('foobar')
    expect(loadPath).to.include('./test/fixtures')
    expect(loadPath).to.include('./test/fixtures/load_path')
    expect(result.stubs).to.have.length(1)
    expect(result.stubs[0]).to.eq('a_stub')
  })

  it('allows additional MRI requires with Rails', function() {
    env.RAILS_ENV = 'foobar'
    env.OPAL_MRI_REQUIRES = 'additional_require'

    const result = bundlerGetMetadata()
    const loadPath = result.loadPath

    expect(loadPath).to.include.match(/gems\/opal.*\/opal/)
    expect(loadPath).to.include.match(/gems\/opal.*\/stdlib/)
    expect(loadPath).to.include.match(/gems\/opal.*\/lib/)
    expect(loadPath).to.include('addtl')
    expect(loadPath).to.include('foobar')
    expect(loadPath).to.include('./test/fixtures')
    expect(loadPath).to.include('./test/fixtures/load_path')
    expect(result.stubs).to.have.length(2)
    expect(result.stubs[0]).to.eq('addtl_stub')
    expect(result.stubs[1]).to.eq('a_stub')
  })
})
