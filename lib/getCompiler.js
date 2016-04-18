'use strict'

const path = require('path')

const Opal = require('./opal')
const LOAD_PATH = require('./getRubyMetadata').loadPath

// TODO: spend some time looking at the exact convention of 'file' as it goes into here
// with different load paths and relative vs. not
// Make sure we match that so we can depend on opal compiler code for exact path resolution
module.exports = function(source, options) {
  // it's important to not give an absolute path to Opal (only relative to load path)
  // otherwise absolute paths end up in the compiled code
  // don't want Opal.modules to have an extension
  var fileToUse = options.file || options.relativeFileName
  fileToUse = fileToUse.replace(path.extname(fileToUse), '')

  const compilerOptions = Object.assign({}, options)
  // these are all covered with the filename was pass to build_str
  delete compilerOptions.filename
  delete compilerOptions.relativeFileName
  delete compilerOptions.file
  // work with opal 0.9 or 0.10
  const compilerClass = Opal.Webpack.Builder
  const builder = compilerClass.$new(Opal.hash({compiler_options: Opal.hash(compilerOptions)}))
  const absoluteLoadPaths = LOAD_PATH.map(lp => path.resolve(lp))
  console.log('appending load paths to builder')
  console.dir(absoluteLoadPaths)
  console.log("Opal.paths")
  console.dir(Opal.Opal.$paths())
  builder.$append_paths.apply(builder, Opal.to_a(absoluteLoadPaths))
  builder.$build_str(source, fileToUse)
  return builder
}
