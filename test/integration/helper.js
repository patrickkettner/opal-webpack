'use strict'
/*jshint expr: true*/

const webpack = require('webpack')
const rimraf = require('rimraf')
const expect = require('chai').expect
const mkdirp = require('mkdirp')
const fs = require('fs')
const path = require('path')
const execSync = require('child_process').execSync
const fsExtra = require('fs-extra')

const cleanScopeAndRequire = require('../support/cleanScopeAndRequire')

RegExp.escape = function(s) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}

module.exports = function() {
  const exportScope = {}
  this.timeout(40000)
  beforeEach(cleanScopeAndRequire)
  beforeEach(function(done) {
    fsExtra.mkdirp('./tmp', done)
  })

  const env = process.env
  const tmpDir = path.resolve(__dirname, '../../tmp')
  const outputBaseDir = path.resolve(tmpDir, 'output')
  exportScope.cacheDir = path.join(outputBaseDir, 'cache')
  const fixturesDir = path.resolve(__dirname, '../fixtures')
  exportScope.currentDirectoryExp = new RegExp(RegExp.escape(process.cwd()))
  exportScope.opalLoader = path.resolve(__dirname, '../../')
  exportScope.outputDir = path.resolve(outputBaseDir, 'loader')
  exportScope.globalConfig = {
    output: {
      path: exportScope.outputDir,
      filename: '[id].loader.js'
    },
    module: {
      loaders: [{
        test: /\.rb$/,
        loader: exportScope.opalLoader
      }]
    }
  }

  exportScope.aFixture = function(file) {
    return path.join(fixturesDir, file)
  }

  exportScope.useTweakedCompiler = function() {
    env.OPAL_COMPILER_PATH = path.resolve(__dirname, '../support/tweakedOpalCompiler.js')
    env.OPAL_RUNTIME_PATH = path.resolve(__dirname, '../support/tweakedOpalRuntime.js')
  }

  exportScope.getOpalRuntimeFilename = function() {
    return require('../../lib/getOpalRuntimeFilename')
  }

  exportScope.assertBasic = function(config, done) {
    webpack(config, (err, stats) => {
      expect(err).to.be.null
      let errors = stats.compilation.errors
      if (errors.length > 0) {
        console.dir(errors[0].stack)
      }
      expect(errors).to.be.empty

      fs.readdir(exportScope.outputDir, (err, files) => {
        expect(err).to.be.null
        expect(files).to.have.length(1)
        fs.readFile(path.resolve(exportScope.outputDir, files[0]), (err, data) => {
          var subject = data.toString()

          expect(err).to.be.null
          expect(subject).to.include('Opal.cdecl($scope, \'HELLO\', 123)')
          expect(subject).to.not.match(exportScope.currentDirectoryExp)
          expect(exportScope.runCode()).to.eq('123\n\n')

          return done()
        })
      })
    })
  }

  exportScope.runCode = function(otherArgs) {
    const args = otherArgs || ''
    const command = `phantomjs ${path.resolve(__dirname, '../support/runPhantom.js')} ${args} ${path.resolve(exportScope.outputDir, '0.loader.js')} 2>&1 || true`
      //console.log(`Running command: ${command}`)
    return execSync(command).toString()
  }

  // the source-map-support plugin that load_source_maps.js loads makes it easy to test this on node
  exportScope.runSourceMapDependentCode = function() {
    const sourceMapFinder = exportScope.aFixture('load_source_maps.js')
    const command = `node -r ${sourceMapFinder} ${path.join(exportScope.outputDir, '0.loader.js')} 2>&1 || true`
      //console.log(`Running command: ${command}`)
    return execSync(command).toString()
  }

  const dependencyMain = exportScope.aFixture('dependency.rb')
  const dependencyBackup = exportScope.aFixture('dependency.rb.backup')

  beforeEach(function(done) {
    fsExtra.copySync(dependencyMain, dependencyBackup, {
      clobber: true
    })
    rimraf(outputBaseDir, function(err) {
      if (err) {
        return done(err)
      }
      mkdirp(exportScope.outputDir, done)
    })
  })

  afterEach(function(done) {
    // cleanup
    fsExtra.copy(dependencyBackup, dependencyMain, {
      clobber: true
    }, done)
  })

  return exportScope
}
