'use strict'

const path = require('path')

module.exports = function () {
  // Opal touches these globals
  const opalBridges = [String, Number, Boolean, Date, Array, Error, RegExp, Function]
  opalBridges.forEach(function (bridge) { delete bridge.$$bridge })

  // fresh requires
  const clean = [
    'getOpalCompilerFilename',
    'getCompiler',
    'opal',
    'bundlerCheck',
    'getRubyMetadata',
    'getOpalVersion',
    'getStub',
    'resolveFilename',
    'transpile'
  ]
  const fullPaths = clean.map(function(p) { return path.resolve(__dirname, `../../lib/${p}.js`) })
  fullPaths.forEach(function(p) {
    delete require.cache[p]
  })

  delete require.cache[path.resolve(__dirname, '../../vendor/opal-compiler.js')]
  delete require.cache[path.resolve(__dirname, '../../index.js')]
  delete require.cache[path.resolve(__dirname, 'tweakedOpalCompiler.js')]

  const env = process.env

  // back to original state
  env.OPAL_USE_BUNDLER = 'false'
  delete env.OPAL_COMPILER_PATH
  delete env.OPAL_MRI_REQUIRES
  delete env.OPAL_COMPILER_REQUIRES
  delete env.OPAL_COMPILER_LOAD_PATH

  if (env.RUBYOPT_ORIG) {
    env.RUBYOPT = env.RUBYOPT_ORIG
  }
  else {
    env.RUBYOPT_ORIG = env.RUBYOPT
  }

  if (env.RUBYLIB_ORIG) {
    env.RUBYLIB = env.RUBYLIB_ORIG
  }
  else {
    env.RUBYLIB_ORIG = env.RUBYLIB
  }

  if (env.OPAL_LOAD_PATH_ORIG) {
    env.OPAL_LOAD_PATH = env.OPAL_LOAD_PATH_ORIG
  }
  else {
    env.OPAL_LOAD_PATH_ORIG = env.OPAL_LOAD_PATH
  }

  delete env.RAILS_ENV

  const removeReqs = []
  for (var reqFile in require.cache) {
    if (/opal-compiler-v.*js/.test(reqFile)) {
      removeReqs.push(reqFile)
    }
  }

  removeReqs.forEach(function(file) {
    // recreating this messes up mocha watch
    //fs.unlinkSync(file)
    delete require.cache[file]
  })
}
