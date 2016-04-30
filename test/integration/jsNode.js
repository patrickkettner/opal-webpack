'use strict'

/*jshint expr: true*/

const webpack = require('webpack')
const expect = require('chai').expect
const fs = require('fs')
const assign = require('object-assign')
const path = require('path')

const helperModule = require('./helper')

describe('integration jsNode', function() {
  const env = process.env
  const helperFunctions = helperModule.call(this)

  it('allows requiring node modules from Opal', function(done) {
    env.OPAL_LOAD_PATH = `./node_modules:${env.OPAL_LOAD_PATH}`

    const config = assign({}, helperFunctions.globalConfig, {
      entry: helperFunctions.aFixture('entry_node_from_opal.js')
    })
    webpack(config, (err, stats) => {
      expect(err).to.be.null
      expect(stats.compilation.errors).to.be.empty

      expect(helperFunctions.runCode()).to.eq('  foo\n\n')
      return done()
    })
  })

  it('Allows requiring ruby files using a webpack require', function(done) {
    const config = assign({}, helperFunctions.globalConfig, {
      entry: helperFunctions.aFixture('entry_wp_require_ruby_file.js')
    })
    webpack(config, (err, stats) => {
      expect(err).to.be.null
      expect(stats.compilation.errors).to.be.empty

      expect(helperFunctions.runCode()).to.eq('123\n\nwe made it\n\n')
      return done()
    })
  })

  it('loads JS requires', function(done) {
    const config = assign({}, helperFunctions.globalConfig, {
      entry: helperFunctions.aFixture('entry_js_require.js')
    })
    webpack(config, (err, stats) => {
      expect(err).to.be.null
      expect(stats.compilation.errors).to.be.empty

      fs.readdir(helperFunctions.outputDir, (err, files) => {
        expect(err).to.be.null
        expect(files).to.have.length(1)
        fs.readFile(path.resolve(helperFunctions.outputDir, files[0]), (err, data) => {
          var subject = data.toString()

          expect(err).to.be.null
          expect(subject).to.not.match(helperFunctions.currentDirectoryExp)
          expect(helperFunctions.runCode()).to.eq('howdy\nagain\n')

          return done()
        })
      })
    })
  })
})
