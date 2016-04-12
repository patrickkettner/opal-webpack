'use strict'

const path = require('path')
const fs = require('fs')

const bundlerExecute = require('./bundlerExecute')
const bundlerCheck = require('./bundlerCheck')

function getBundlerFilename() {
  const versionString = bundlerExecute('opal -v').toString().trim() // faster than running opal itself
  const versionOnly = /Opal (.*)/.exec(versionString)[1]
  return path.resolve(__dirname, `../vendor/opal-compiler-${versionOnly}.js`)
}

function bundledFileExists(filename) {
  try {
    const stats = fs.statSync(filename)
    return stats.isFile()
  }
  catch (err) {
    return false
  }
}

function createBundledCompiler(filename) {
  const env = process.env
  console.log(`Bundle derived compiler ${filename} doesn't exist. Creating!`)
  const compilerPath = path.resolve(__dirname, 'compiler.rb')
  // our patches live in lib
  var loadPaths = ['lib']
  if (env.OPAL_COMPILER_LOAD_PATH) {
    loadPaths = loadPaths.concat(env.OPAL_COMPILER_LOAD_PATH.split(':'))
  }
  const flatLoadPaths = loadPaths.map(p => `-I${p}`).join(' ')
  var requires = env.OPAL_COMPILER_REQUIRES
  if (requires && (requires = requires.split(':')).length > 0) {
    requires = requires.map(req => `-r${req}`).join(' ')
  }
  else {
    requires = ''
  }
  bundlerExecute(`opal --no-exit ${flatLoadPaths} ${requires} -c ${compilerPath} > ${filename}`)
}

var cachedResult = null

module.exports = function () {
  if (cachedResult) {
    return cachedResult
  }

  const env = process.env

  if (bundlerCheck()) {
    const filename = getBundlerFilename()

    if (!bundledFileExists(filename)) {
      createBundledCompiler(filename)
    }

    cachedResult = filename
  }
  else if (typeof env.OPAL_COMPILER_PATH !== 'undefined') {
    cachedResult = path.resolve(env.OPAL_COMPILER_PATH)
  }
  else {
    cachedResult = path.resolve(__dirname, '../vendor/opal-compiler.js')
  }

  return cachedResult
}
