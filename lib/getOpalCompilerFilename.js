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
  // our patches live in lib / same directory as this file
  var loadPaths = [__dirname]
  if (env.OPAL_COMPILER_LOAD_PATH) {
    loadPaths = loadPaths.concat(env.OPAL_COMPILER_LOAD_PATH.split(':'))
  }
  const flatLoadPaths = loadPaths.map(p => `-I${p}`).join(' ')
  var requires = env.OPAL_COMPILER_REQUIRES
  if (requires && (requires = requires.split(':')).length > 0) {
    // last element needs an extension, so put it on all of them
    requires = requires.map(req => path.extname(req) === '' ? `${req}.rb` : req)
    .map((req, index) => {
      // in order to append all of these, we make the first N requires and the last the actual file (see below)
      return index == requires.length -1 ? req : `-r${req}`
    }).join(' ')
  }
  else {
    requires = ''
  }
  try {
    bundlerExecute(`opal --no-exit -ghike --no-opal ${flatLoadPaths} -c ${compilerPath} > ${filename}`)
    // need to append the additional requires after we do everything else since we have special monkey patching
    if (requires !== '') {
      bundlerExecute(`opal --no-exit --no-opal -c ${flatLoadPaths} ${requires} >> ${filename}`)
    }
  }
  catch(e) {
    fs.unlinkSync(filename)
    throw e
  }
}

function getFilename() {
  const env = process.env
  var result

  if (bundlerCheck()) {
    const filename = getBundlerFilename()

    if (!bundledFileExists(filename)) {
      createBundledCompiler(filename)
    }

    result = filename
  }
  else if (typeof env.OPAL_COMPILER_PATH !== 'undefined') {
    result = path.resolve(env.OPAL_COMPILER_PATH)
  }
  else {
    result = path.resolve(__dirname, '../vendor/opal-compiler.js')
  }
  return result
}

module.exports = getFilename()
