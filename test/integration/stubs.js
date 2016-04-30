'use strict'

/*jshint expr: true*/

const webpack = require('webpack')
const expect = require('chai').expect
const assign = require('object-assign')
const fs = require('fs')
const path = require('path')

const helperModule = require('./helper')

describe('integration stubs', function() {
  const env = process.env

  const helperFunctions = helperModule.call(this)

  it('works with stubs', function(done) {
    const config = assign({}, helperFunctions.globalConfig, {
      entry: helperFunctions.aFixture('entry_another_dep.js'),
      opal: {
        stubs: ['dependency']
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
          expect(subject).to.not.include('Opal.cdecl($scope, \'HELLO\', 123)')
          expect(subject).to.include('Opal.cdecl($scope, \'INSIDE\', 789)')
          expect(subject).to.not.match(helperFunctions.currentDirectoryExp)
          expect(helperFunctions.runCode()).to.eq('we made it\n\n')

          return done()
        })
      })
    })
  })

  it('pulls stubs from Opal gems', function(done) {
    env.OPAL_MRI_REQUIRES = 'additional_require'
    env.RUBYLIB = env.RUBYLIB + ':test/support'

    const config = assign({}, helperFunctions.globalConfig, {
      entry: helperFunctions.aFixture('entry_gem_stub.js')
    })

    webpack(config, (err, stats) => {
      expect(err).to.be.null
      expect(stats.compilation.errors).to.be.empty
      expect(helperFunctions.runCode()).to.eq('made it past stub\n\n')
      return done()
    })
  })

  it('allows stubbing Opal requires so they can be provided outside webpack', function(done) {
    const config = assign({}, helperFunctions.globalConfig, {
      entry: helperFunctions.aFixture('entry_basic.js'),
      opal: {
        externalOpal: true
      }
    })
    webpack(config, (err) => {
      if (err) {
        return done(err)
      }
      expect(helperFunctions.runCode(helperFunctions.getOpalRuntimeFilename())).to.eq('123\n\n')

      return done()
    })
  })

  it('allows stub inside require', function(done) {
    const config = assign({}, helperFunctions.globalConfig, {
      entry: helperFunctions.aFixture('entry_nested_stub.js'),
      opal: {
        stubs: ['dependency']
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
          expect(subject).to.not.include('Opal.cdecl($scope, \'HELLO\', 123)')
          expect(subject).to.include('Opal.cdecl($scope, \'INSIDE\', 789)')
          expect(subject).to.not.match(helperFunctions.currentDirectoryExp)
            // the stub
          expect(subject).to.include('Opal.modules["dependency"]')
          expect(subject).to.include('Opal.modules["another_dependency"]')
          expect(subject).to.include('Opal.modules["inside_load_path"]')
          expect(helperFunctions.runCode()).to.eq('we made it\n\n')

          return done()
        })
      })
    })
  })
})
