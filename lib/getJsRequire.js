'use strict'

module.exports = function(relativePath, absolutePath) {
  return [
    `require('${require.resolve('imports-loader')}!${absolutePath}');`,
    `Opal.loaded('${relativePath}');`
  ]
}
