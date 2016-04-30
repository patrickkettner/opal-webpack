'use strict'

const webpack = require('webpack')
const expect = require('chai').expect
const assign = require('object-assign')
const execSync = require('child_process').execSync

const helperModule = require('./helper')

describe('integration distro', function() {
  const env = process.env
  const helperFunctions = helperModule.call(this)

  it('specific MRI require', function(done) {
    if (execSync('opal -v').toString().trim().indexOf('0.10') != -1) {
      // some issues with 0.10 and opal-browser
      this.skip()
      return done()
    }

    env.OPAL_MRI_REQUIRES = 'opal-browser'

    const config = assign({}, helperFunctions.globalConfig, {
      entry: helperFunctions.aFixture('entry_bundler_opal.js')
    })

    webpack(config, (err) => {
      if (err) {
        return done(err)
      }
      expect(helperFunctions.runCode().trim()).to.eq('0.2.0')

      return done()
    })
  })

  it('allows using a statically provided Opal distro', function(done) {
    helperFunctions.useTweakedCompiler()

    const config = assign({}, helperFunctions.globalConfig, {
      entry: helperFunctions.aFixture('entry_static_opal.js')
    })

    webpack(config, (err) => {
      if (err) {
        return done(err)
      }
      expect(helperFunctions.runCode().trim()).to.eq('0.10.0.beta2.webpacktest')

      return done()
    })
  })

  it('allows using bundler for compilation/dependencies', function(done) {
    if (execSync('opal -v').toString().trim().indexOf('0.10') != -1) {
      // some issues with 0.10 and opal-browser
      this.skip()
    }

    env.OPAL_USE_BUNDLER = 'true'

    this.timeout(60000)

    const config = assign({}, helperFunctions.globalConfig, {
      entry: helperFunctions.aFixture('entry_bundler_opal.js')
    })

    webpack(config, (err) => {
      if (err) {
        return done(err)
      }
      expect(helperFunctions.runCode().trim()).to.eq('0.2.0')

      return done()
    })
  })

  it('allows Bundler for dependencies with an external opal', function(done) {
    if (execSync('opal -v').toString().trim().indexOf('0.10') != -1) {
      // some issues with 0.10 and opal-browser
      this.skip()
    }

    env.OPAL_USE_BUNDLER = 'true'

    const config = assign({}, helperFunctions.globalConfig, {
      entry: helperFunctions.aFixture('entry_bundler_opal.js'),
      opal: {
        externalOpal: true
      }
    })

    webpack(config, (err) => {
      if (err) {
        return done(err)
      }
      expect(helperFunctions.runCode(helperFunctions.getOpalRuntimeFilename()).trim()).to.eq('0.2.0')

      return done()
    })
  })

  it('allows using a bundler provided Opal distro with mini', function(done) {
    env.OPAL_USE_BUNDLER = 'true'

    const config = assign({}, helperFunctions.globalConfig, {
      entry: helperFunctions.aFixture('entry_bundler_mini.js')
    })

    webpack(config, (err) => {
      if (err) {
        return done(err)
      }
      expect(helperFunctions.runCode().trim()).to.eq('howdy')

      return done()
    })
  })
})
