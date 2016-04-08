'use strict'

const Opal = require('./opal')
const withoutLeadingRelativeOrExtension = require('./withoutLeadingRelativeOrExtension')

// TODO: spend some time looking at the exact convention of 'file' as it goes into here
// with different load paths and relative vs. not
// Make sure we match that so we can depend on opal compiler code for exact path resolution
module.exports = function(source, options) {
  // it's important to not give an absolute path to Opal (only relative to load path)
  // otherwise absolute paths end up in the compiled code
  // don't want Opal.modules to have an extension
  const withoutExtension = withoutLeadingRelativeOrExtension(options.relativeFileName)
  const compilerOptions = Object.assign(options, {
    file: withoutExtension // opal calls it file
  })
  delete compilerOptions.filename
  return Opal.Opal.Compiler.$new(source, Opal.hash(compilerOptions))
}
