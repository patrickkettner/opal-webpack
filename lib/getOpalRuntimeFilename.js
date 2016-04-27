'use strict'

const path = require('path')
const fs = require('fs')

const bundlerExecute = require('./bundlerExecute')
const bundlerCheck = require('./bundlerCheck')
// we have to match the compiler anyways, which has already been loaded
const opalVersion = require('./getOpalVersion')

function getBundlerFilename() {
  return path.resolve(__dirname, `../vendor/opal-runtime-v${opalVersion}.js`)
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

function createBundledRuntime(filename) {
  console.log(`Bundle derived runtime ${filename} doesn't exist. Creating!`)
  try {
    bundlerExecute(`echo '' | opal --no-exit -c > ${filename}`)
  }
  catch(e) {
    fs.unlinkSync(filename)
    throw e
  }
}

function getFilename() {
  const env = process.env

  if (bundlerCheck()) {
    const filename = getBundlerFilename()

    if (!bundledFileExists(filename)) {
      createBundledRuntime(filename)
    }

    return filename
  }
  else if (typeof env.OPAL_RUNTIME_PATH !== 'undefined') {
    return path.resolve(env.OPAL_RUNTIME_PATH)
  }

  return path.resolve(__dirname, '../vendor/opal-runtime.js')
}

module.exports = getFilename()
