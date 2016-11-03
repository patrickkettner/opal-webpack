'use strict'

const queryString = require('querystring')

function filterNonQueryPassOptions(options) {
  const passOnOptions = Object.assign({}, options)
  delete passOnOptions.sourceRoot
  delete passOnOptions.filename
  delete passOnOptions.sourceMap
  // stubs are global, do not want to locally override these
  delete passOnOptions.stubs
  delete passOnOptions.loaders
  delete passOnOptions.externalOpal
  return passOnOptions
}

function getSubLoaders(subLoaders, absolutePath) {
  let result = '!'

  if (Array.isArray(subLoaders)) {
    subLoaders
      .filter(sL => absolutePath.match(sL.test))
      .forEach(sL => {
        if (Array.isArray(sL.loader)) {
          result += sL.loader.join('!') + '!'
        } else if (typeof sL.loader === 'string') {
          result += sL.loader
          if ('query' in sL) {
            var query = JSON.stringify(sL.query)
            // since we are using a single quote in the resulting require call,
            // we need to escape it here to prevent it from breaking the require
            query = query.replace(/'/g, "\\'")
            result += `?${query}`
          }
        }
      })
  }

  return result
}

const noRequireable = require('./getOpalRequiresForStubbing')

module.exports = function(context, options, relativePath, absolutePath) {
  const subLoaders = getSubLoaders(options.loaders, absolutePath)
  const passOnOptions = filterNonQueryPassOptions(options)
  const requirable = noRequireable.indexOf(relativePath) == -1
  Object.assign(passOnOptions, {
    file: relativePath,
    requirable: requirable
  })
  const flat = queryString.stringify(passOnOptions)
  return `require('!!${context.path}?${flat}${subLoaders}!${absolutePath}');`
}
