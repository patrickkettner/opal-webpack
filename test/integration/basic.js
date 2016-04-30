'use strict'

/*jshint expr: true*/

const webpack = require('webpack')
const expect = require('chai').expect
const assign = require('object-assign')
const exec = require('child_process').exec
const fs = require('fs')
const path = require('path')

const helperModule = require('./helper')

describe('integration basic', function() {
  const helperFunctions = helperModule.call(this)

  it('loads basic files', function(done) {
    const config = assign({}, helperFunctions.globalConfig, {
      entry: helperFunctions.aFixture('entry_basic.js')
    })
    helperFunctions.assertBasic(config, done)
  })

  // not an end to end test, but since it's a bit slower, put here instead of unit test
  it('matches our bundler test version', function(done) {
    const opalVersion = Opal.get('RUBY_ENGINE_VERSION')

    exec('opal -e "puts RUBY_ENGINE_VERSION"', function(err, stdout) {
      if (err) {
        done(err)
      }
      expect(stdout.trim()).to.eq(opalVersion)
      return done()
    })
  })

  it('passes compiler args to all files it compiles', function(done) {
    const config = assign({}, helperFunctions.globalConfig, {
      entry: helperFunctions.aFixture('entry_arity.js'),
      module: {
        loaders: [{
          test: /\.rb$/,
          loader: helperFunctions.opalLoader,
          query: {
            arity_check: true
          }
        }]
      }
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
          expect(helperFunctions.runCode()).to.eq('[Object#onearg] wrong number of arguments(0 for 1)\n\n[Object#two_arg] wrong number of arguments(1 for 2)\n\n')

          return done()
        })
      })
    })
  })

  it('handles errors', function(done) {
    const opalVersion = require('../../lib/opal').get('RUBY_ENGINE_VERSION')
    const config = assign({}, helperFunctions.globalConfig, {
      entry: helperFunctions.aFixture('entry_error.js')
    })

    webpack(config, (err, stats) => {
      let errors = stats.compilation.errors
      expect(errors).to.have.length(1)
      let error = errors[0]
      expect(error).to.be.an.instanceof(Error)
      if (opalVersion.indexOf('0.9') != -1) {
        expect(error.message).to.match(/Module build failed.*An error occurred while compiling:.*error[\s\S]+3:0/)
      } else {
        // Opal 0.10 regression - https://github.com/opal/opal/pull/1426
        // and https://github.com/opal/opal/issues/1427
        expect(error.message).to.match(/Module build failed.*An error occurred while compiling:.*error/)
      }
      return done()
    })
  })
})
