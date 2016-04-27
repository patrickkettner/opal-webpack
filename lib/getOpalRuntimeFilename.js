'use strict'

const path = require('path')

function getFilename() {
  const env = process.env

  if (typeof env.OPAL_RUNTIME_PATH !== 'undefined') {
    return path.resolve(env.OPAL_RUNTIME_PATH)
  }

  return path.resolve(__dirname, '../vendor/opal-runtime.js')
}

module.exports = getFilename()
