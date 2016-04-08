'use strict'

const queryString = require('querystring')

function filterNonQueryPassOptions(options) {
  const passOnOptions = Object.assign({}, options)
  delete passOnOptions.sourceRoot
  delete passOnOptions.filename
  delete passOnOptions.sourceMap
  delete passOnOptions.relativeFileName
  // stubs are global, do not want to locally override these
  delete passOnOptions.stubs
  return passOnOptions
}

module.exports = function(context, options, relativePath, absolutePath) {
  const passOnOptions = filterNonQueryPassOptions(options)
  Object.assign(passOnOptions, {
    file: relativePath,
    requirable: true
  })
  const flat = queryString.stringify(passOnOptions)
  return `require('!!${context.path}?${flat}!${absolutePath}');`
}
