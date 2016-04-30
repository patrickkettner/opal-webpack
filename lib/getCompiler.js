'use strict'

const path = require('path')

const Opal = require('./opal')
const pathReader = require('./pathReader')
const LOAD_PATH = require('./getRubyMetadata').loadPath

module.exports = function(source, options) {
  const compilerOptions = Object.assign({}, options)
  // these are all covered with the filename was pass to build_str
  delete compilerOptions.filename
  delete compilerOptions.file
  const compilerClass = Opal.Webpack.Builder
  const builder = compilerClass.$new(Opal.hash({compiler_options: Opal.hash(compilerOptions)}))
  builder['$path_reader='](pathReader)
  const absoluteLoadPaths = LOAD_PATH.map(lp => path.resolve(lp))
  builder.$append_paths.apply(builder, Opal.to_a(absoluteLoadPaths))
  builder.$build_str(source, options.file)
  return builder
}
