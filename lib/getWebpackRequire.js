'use strict'

const queryString = require('querystring')

function filterNonQueryPassOptions(options) {
  const passOnOptions = Object.assign({}, options)
  delete passOnOptions.sourceRoot
  delete passOnOptions.currentLoader
  delete passOnOptions.filename
  delete passOnOptions.sourceMap
  delete passOnOptions.relativeFileName
  // stubs are global, do not want to locally override these
  delete passOnOptions.stubs
  return passOnOptions
}

module.exports = function(options, relativePath, absolutePath) {
  const passOnOptions = filterNonQueryPassOptions(options)
  Object.assign(passOnOptions, {
    file: relativePath,
    requirable: true
  })
  const flat = queryString.stringify(passOnOptions)
  return `require('!!${options.currentLoader}?${flat}!${absolutePath}');`
}
