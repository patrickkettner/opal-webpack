'use strict'

const getCompiler = require('./getCompiler')

module.exports = function(relativePath) {
  const compilerOptions = {
    file: relativePath,
    requirable: true
  }
  const compiler = getCompiler('', compilerOptions)
  return compiler.$to_s()
}
