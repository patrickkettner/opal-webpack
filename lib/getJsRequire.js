'use strict'

module.exports = function(relativePath, absolutePath) {
  return [
    `require('imports!${absolutePath}');`,
    `Opal.loaded('${relativePath}');`
  ]
}
