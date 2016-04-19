'use strict'

const opalRequiresForStubbing = require('./getOpalRequiresForStubbing')
const opalCompilerFilename = require('./getOpalRuntimeFilename')
const useBundler = require('./bundlerCheck')()
const Opal = require('./opal')

module.exports = function resolveFilename(compiler, filename) {
  // in bundler mode, we'll use granular assets
  if (!useBundler && opalRequiresForStubbing.indexOf(filename) != -1) {
    return opalCompilerFilename
  }
  const reader = compiler.$path_reader()

  const result = reader.$expand(filename)
  if (result === Opal.nil) {
    throw new Error(`Cannot find file - ${filename} in load path ${reader.$paths()}`)
  }
  return result
}
