'use strict'

module.exports = function (filename) {
  const relativePath = /\.\/(.*)(\.\S+)?/.exec(filename)
  return relativePath ? relativePath[1] : filename
}
