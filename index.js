'use strict'

// allow watch unit testing more easily
if (typeof Opal === 'undefined') {
  require('./vendor/opal-compiler.js')
}

const loaderUtils = require('loader-utils')
const fs = require('fs')
const pkg = require('./package.json')
const cache = require('./lib/fs-cache')
const resolveFilename = require('./lib/resolveFilename')
const opalVersion = Opal.get('RUBY_ENGINE_VERSION')
const transpile = require('./lib/transpile')

function getCurrentLoader(loaderContext) {
  return loaderContext.loaders[loaderContext.loaderIndex]
}

module.exports = function(source) {
  var result = {}

  const webpackRemainingChain = loaderUtils.getRemainingRequest(this).split('!')
  const filename = webpackRemainingChain[webpackRemainingChain.length - 1]
  const globalOptions = this.options.opal || {}
  const loaderOptions = loaderUtils.parseQuery(this.query)
  const userOptions = Object.assign({}, globalOptions, loaderOptions)
  const relativeFileName = resolveFilename(filename).relative
  const defaultOptions = {
    sourceRoot: process.cwd(),
    currentLoader: getCurrentLoader(this).path,
    filename: filename,
    relativeFileName: relativeFileName,
    cacheIdentifier: JSON.stringify({
      'opal-loader': pkg.version,
      'opal-compiler': opalVersion,
      env: process.env.OPAL_ENV || process.env.NODE_ENV
    })
  }
  const options = Object.assign({}, defaultOptions, userOptions)

  if (userOptions.sourceMap === undefined) {
    options.sourceMap = this.sourceMap
  }

  const cacheDirectory = options.cacheDirectory
  const cacheIdentifier = options.cacheIdentifier

  this.cacheable()

  if (cacheDirectory) {
    var callback = this.async()
    return cache({
      directory: cacheDirectory,
      identifier: cacheIdentifier,
      source: source,
      options: options,
      transform: transpile
    }, function(err, result) {
      if (err) {
        return callback(err)
      }
      return callback(null, result.code, result.map)
    })
  }
  result = transpile(source, options)
  this.callback(null, result.code, result.map)
}
