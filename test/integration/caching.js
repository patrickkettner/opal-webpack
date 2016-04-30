'use strict'

/*jshint expr: true*/

const webpack = require('webpack')
const expect = require('chai').expect
const assign = require('object-assign')
const fs = require('fs')
const path = require('path')

const helperModule = require('./helper')

describe('integration caching', function() {
  const helperFunctions = helperModule.call(this)

  it('allows caching to a specific directory', function(done) {
    const config = assign({}, helperFunctions.globalConfig, {
      entry: helperFunctions.aFixture('entry_basic.js'),
      module: {
        loaders: [{
          test: /\.rb$/,
          loader: helperFunctions.opalLoader,
          query: {
            cacheDirectory: helperFunctions.cacheDir
          }
        }]
      }
    })
    helperFunctions.assertBasic(config, () => {
      // run again and use the cache
      helperFunctions.assertBasic(config, () => {
        fs.readdir(helperFunctions.cacheDir, (err, files) => {
          expect(err).to.be.null
            // 1 file + opal
          expect(files).to.have.length(2)
          return done()
        })
      })
    })
  })

  it('caches multiple modules', function(done) {
    const config = assign({}, helperFunctions.globalConfig, {
      entry: helperFunctions.aFixture('entry_another_dep.js'),
      module: {
        loaders: [{
          test: /\.rb$/,
          loader: helperFunctions.opalLoader,
          query: {
            cacheDirectory: helperFunctions.cacheDir
          }
        }]
      }
    })
    webpack(config, (err, stats) => {
      expect(err).to.be.null
      expect(stats.compilation.errors).to.be.empty

      fs.readdir(helperFunctions.cacheDir, (err, files) => {
        expect(err).to.be.null
          // 3 dependencies + opal
        expect(files).to.have.length(4)
        return done()
      })
    })
  })

  it('caches source maps', function(done) {
    const config = assign({}, helperFunctions.globalConfig, {
      entry: helperFunctions.aFixture('entry_source_maps.js'),
      devtool: 'source-map',
      module: {
        loaders: [{
          test: /\.rb$/,
          loader: helperFunctions.opalLoader,
          query: {
            cacheDirectory: helperFunctions.cacheDir
          }
        }]
      }
    })
    webpack(config, (err, stats) => {
      expect(err).to.be.null
      expect(stats.compilation.errors).to.be.empty

      fs.readdir(helperFunctions.outputDir, (err, files) => {
        expect(err).to.be.null
        expect(files).to.have.length(2)
        var output = helperFunctions.runSourceMapDependentCode()
        expect(output).to.match(/output\/loader\/webpack:\/tmp\/fixtures\/source_maps\.rb:4:3\)/)
        expect(output).to.match(/output\/loader\/webpack:\/tmp\/fixtures\/source_maps.rb:7:1\)/)
        return done()
      })
    })
  })

  // https://github.com/cj/opal-webpack/issues/35
  it('picks up new files in require_tree directories when caching', function(done) {
    const config = assign({}, helperFunctions.globalConfig, {
      entry: helperFunctions.aFixture('entry_tree.js'),
      opal: {
        cacheDirectory: helperFunctions.cacheDir
      }
    })
    const compiler = webpack(config)
    var runCount = 0
    var watcher = compiler.watch({}, (err, stats) => {
      runCount += 1
      expect(err).to.be.null
      const compilation = stats.compilation
      expect(compilation.errors).to.be.empty
      if (runCount == 1) {
        expect(helperFunctions.runCode()).to.eq('inside the tree\n\n')
        fs.writeFile(path.resolve(helperFunctions.fixturesDir, 'tree/file3.rb'), 'puts "another"')
        fs.writeFile(helperFunctions.aFixture('entry_tree.js'), "require('./tree.rb')")
      } else if (runCount == 2) {
        expect(helperFunctions.runCode()).to.eq('inside the tree\n\nanother\n\n')
        watcher.close(done)
      }
    })
  })
})
