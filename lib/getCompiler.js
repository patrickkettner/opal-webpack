'use strict'

const path = require('path')

// TODO: spend some time looking at the exact convention of 'file' as it goes into here
// with different load paths and relative vs. not
// Make sure we match that so we can depend on opal compiler code for exact path resolution
module.exports = function(source, options) {
  // it's important to not give an absolute path to Opal (only relative to load path)
  // otherwise absolute paths end up in the compiled code
  const relativePath = options.relativeFileName
    // don't want Opal.modules to have an extension
  const withoutExtension = relativePath.replace(path.extname(relativePath), '')
  const compilerOptions = Object.assign({
    file: withoutExtension // opal calls it file
  }, options)
  delete compilerOptions.filename
  return Opal.Opal.Compiler.$new(source, Opal.hash(compilerOptions))
}
