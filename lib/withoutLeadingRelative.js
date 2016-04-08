'use strict'

module.exports = function (filename) {
  const relativePath = /\.\/(.*)/.exec(filename)
  return relativePath ? relativePath[1] : filename
}
