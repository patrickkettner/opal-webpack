'use strict'

/*jshint expr: true*/

const webpack = require('webpack')
const expect = require('chai').expect
const assign = require('object-assign')
const fs = require('fs')
const path = require('path')

const helperModule = require('./helper')

describe('integration require_tree', function() {
  const helperFunctions = helperModule.call(this)

  it('loads require_tree', function(done) {
    const config = assign({}, helperFunctions.globalConfig, {
      entry: helperFunctions.aFixture('entry_tree.js')
    })
    webpack(config, function(err, stats) {
      expect(err).to.be.null
      expect(stats.compilation.errors).to.be.empty

      fs.readdir(helperFunctions.outputDir, function(err, files) {
        expect(err).to.be.null
        expect(files).to.have.length(1)
        fs.readFile(path.resolve(helperFunctions.outputDir, files[0]), function(err, data) {
          var subject = data.toString()

          expect(err).to.be.null
          expect(subject).to.include('Opal.cdecl($scope, \'HELLO\', 123)')
          expect(subject).to.include('Opal.cdecl($scope, \'THERE\', 456)')
          expect(subject).to.not.match(helperFunctions.currentDirectoryExp)
          expect(subject).to.include('$require_tree("tree")')
          expect(subject).to.include('Opal.modules["tree/file1"]')
          expect(subject).to.include('Opal.modules["tree/file2"]')
          expect(helperFunctions.runCode()).to.eq('inside the tree\n\n')

          return done()
        })
      })
    })
  })

  it('loads require_tree with nested directories', function(done) {
    const config = assign({}, helperFunctions.globalConfig, {
      entry: helperFunctions.aFixture('entry_tree_nested.js')
    })
    webpack(config, function(err, stats) {
      expect(err).to.be.null
      expect(stats.compilation.errors).to.be.empty

      expect(helperFunctions.runCode()).to.eq('we made it\n\n')

      return done()
    })
  })

  it('loads require_tree without leading dot', function(done) {
    const config = assign({}, helperFunctions.globalConfig, {
      entry: helperFunctions.aFixture('entry_tree_no_dot.js')
    })
    webpack(config, function(err, stats) {
      expect(err).to.be.null
      expect(stats.compilation.errors).to.be.empty

      fs.readdir(helperFunctions.outputDir, function(err, files) {
        expect(err).to.be.null
        expect(files).to.have.length(1)
        fs.readFile(path.resolve(helperFunctions.outputDir, files[0]), function(err, data) {
          var subject = data.toString()

          expect(err).to.be.null
          expect(subject).to.include('Opal.cdecl($scope, \'HELLO\', 123)')
          expect(subject).to.include('Opal.cdecl($scope, \'THERE\', 456)')
          expect(subject).to.not.match(helperFunctions.currentDirectoryExp)
          expect(subject).to.include('$require_tree("tree")')
          expect(subject).to.include('Opal.modules["tree/file1"]')
          expect(subject).to.include('Opal.modules["tree/file2"]')
          expect(helperFunctions.runCode()).to.eq('inside the tree\n\n')

          return done()
        })
      })
    })
  })

  // https://github.com/cj/opal-webpack/issues/35
  it('picks up new files in require_tree directories', function(done) {
    const config = assign({}, helperFunctions.globalConfig, {
      entry: helperFunctions.aFixture('entry_tree.js')
    })
    const compiler = webpack(config)
    var runCount = 0
    var watcher = compiler.watch({}, (err, stats) => {
      runCount += 1
      expect(err).to.be.null
      const compilation = stats.compilation
      expect(compilation.errors).to.be.empty
      if (runCount == 2) {
        expect(helperFunctions.runCode()).to.eq('inside the tree\n\n')
        fs.writeFile(path.resolve(helperFunctions.fixturesDir, 'tree/file3.rb'), 'puts "another"')
        fs.writeFile(helperFunctions.aFixture('entry_tree.js'), "require('./tree.rb')")
      } else if (runCount == 3) {
        expect(helperFunctions.runCode()).to.eq('inside the tree\n\nanother\n\n')
        watcher.close(done)
      }
    })
  })
})
