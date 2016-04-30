'use strict'

/*jshint expr: true*/

const webpack = require('webpack')
const expect = require('chai').expect
const fs = require('fs')
const path = require('path')
const assign = require('object-assign')

const helperModule = require('./helper')

describe('integration require', function() {
  const helperFunctions = helperModule.call(this)

  it('loads requires', function(done) {
    const config = assign({}, helperFunctions.globalConfig, {
      entry: helperFunctions.aFixture('entry_another_dep.js')
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
          expect(subject).to.include('Opal.cdecl($scope, \'HELLO\', 123)')
          expect(subject).to.include('Opal.cdecl($scope, \'INSIDE\', 789)')
          expect(subject).to.not.match(helperFunctions.currentDirectoryExp)
          expect(helperFunctions.runCode()).to.eq('123\n\nwe made it\n\n')

          return done()
        })
      })
    })
  })

  it('loads require_relatives', function(done) {
    const config = assign({}, helperFunctions.globalConfig, {
      entry: helperFunctions.aFixture('entry_another_dep_relative.js')
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
          expect(subject).to.include('Opal.cdecl($scope, \'HELLO\', 123)')
          expect(subject).to.include('Opal.cdecl($scope, \'INSIDE\', 789)')
          expect(subject).to.not.match(helperFunctions.currentDirectoryExp)
          expect(helperFunctions.runCode()).to.eq('123\n\nwe made it\n\n')

          return done()
        })
      })
    })
  })

  it('loads require_relative', function(done) {
    const config = assign({}, helperFunctions.globalConfig, {
      entry: helperFunctions.aFixture('entry_relative.js')
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
          expect(subject).to.include('Opal.cdecl($scope, \'HELLO\', 123)')
            // don't want paths hard coded to machines in here
          expect(subject).to.not.match(helperFunctions.currentDirectoryExp)
          expect(subject).to.include('Opal.modules["tree/file1"]')
          expect(helperFunctions.runCode()).to.eq('inside the tree\n\n')

          return done()
        })
      })
    })
  })
})
