'use strict'

const loaderUtils = require('loader-utils')

module.exports = function(relativePath, absolutePath) {
  return [
    `require('imports!${absolutePath}');`,
    `Opal.loaded('${relativePath}');`
  ]
}
