'use strict'

const path = require('path')

const resolveFilename = require('./resolveFilename')
const processSourceMaps = require('./processSourceMaps')
const getCompiler = require('./getCompiler')
const getOpalStub = require('./getOpalStub')
const getWebpackRequire = require('./getWebpackRequire')
const getJsRequire = require('./getJsRequire')

module.exports = function transpile(source, options, context) {
  const compiler = getCompiler(source, options)

  compiler.$compile()

  const result = compiler.$result()

  /*
    Workaround to make IO work,
    webpack polyfill global "process" module by default,
    while Opal::IO rely on it to deterimine in node environment or not
  */
  let prepend = ['process = undefined;']

  const addRequires = files => {
    files.forEach(filename => {
      var isStub = options.stubs && options.stubs.indexOf(filename) != -1
      var resolved = isStub ? null : resolveFilename(filename).absolute
      if (resolved && resolved.match(/\.js$/)) {
        prepend = prepend.concat(getJsRequire(filename, resolved))
      } else {
        var statement = isStub ? getOpalStub(filename) : getWebpackRequire(context, options, filename, resolved)
        prepend.push(statement)
      }
    })
  }

  addRequires(compiler.$requires())

  compiler.$required_trees().forEach(function(dirname) {
    // path will only be relative to the file we're processing
    let resolved = path.resolve(options.filename, '..', dirname)
      // TODO: Look into making this async
    let files = fs.readdirSync(resolved)
    let withPath = []
      // fs.readdir only returns the filenames, not the base directory
    files.forEach(function(filename) {
      withPath.push(path.join(dirname, filename))
    })
    addRequires(withPath)
  })

  let response = {
    code: prepend.join(' ') + '\n' + result
  }
  if (options.sourceMap) {
    response.map = processSourceMaps(compiler, source, options.filename, result, prepend)
  }
  return response
}
