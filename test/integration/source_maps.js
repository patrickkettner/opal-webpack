'use strict'

/*jshint expr: true*/

const webpack = require('webpack')
const expect = require('chai').expect
const assign = require('object-assign')
const fs = require('fs')

const helperModule = require('./helper')

describe('integration source_maps', function() {
  const helperFunctions = helperModule.call(this)

  it('outputs correct source maps', function(done) {
    const config = assign({}, helperFunctions.globalConfig, {
      entry: helperFunctions.aFixture('entry_source_maps.js'),
      devtool: 'source-map'
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

  it('outputs correct nested source maps', function(done) {
    const config = assign({}, helperFunctions.globalConfig, {
      entry: helperFunctions.aFixture('entry_source_maps_nested.js'),
      devtool: 'source-map'
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

  it('outputs correct source maps when stubs are used', function(done) {
    const config = assign({}, helperFunctions.globalConfig, {
      entry: helperFunctions.aFixture('entry_source_maps_stubs.js'),
      devtool: 'source-map',
      opal: {
        stubs: ['dependency1', 'dependency2', 'dependency3', 'dependency4']
      }
    })
    webpack(config, (err, stats) => {
      expect(err).to.be.null
      expect(stats.compilation.errors).to.be.empty

      fs.readdir(helperFunctions.outputDir, (err, files) => {
        expect(err).to.be.null
        expect(files).to.have.length(2)
        var output = helperFunctions.runSourceMapDependentCode()
        expect(output).to.match(/output\/loader\/webpack:\/tmp\/fixtures\/source_maps_stubs\.rb:8:3\)/)
        expect(output).to.match(/output\/loader\/webpack:\/tmp\/fixtures\/source_maps_stubs.rb:11:1\)/)
        return done()
      })
    })
  })
})
