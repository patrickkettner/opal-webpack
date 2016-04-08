'use strict'

const path = require('path')

const resolveFilename = require('./resolveFilename')
const processSourceMaps = require('./processSourceMaps')
const getCompiler = require('./getCompiler')
const getOpalStub = require('./getOpalStub')
const getWebpackRequire = require('./getWebpackRequire')
const getJsRequire = require('./getJsRequire')

function getStubFilename(stubs, filename) {
  const relativePath = /\.\/(.*)/.exec(filename)
  if (stubs.indexOf(filename) != -1) {
    return filename
  }
  if (relativePath && stubs.indexOf(relativePath[1]) != -1) {
    return relativePath[1]
  }
}

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
      var stubFilename = options.stubs && getStubFilename(options.stubs, filename)
      var resolved = stubFilename ? null : resolveFilename(filename).absolute
      if (resolved && resolved.match(/\.js$/)) {
        prepend = prepend.concat(getJsRequire(filename, resolved))
      } else {
        var statement = stubFilename ? getOpalStub(stubFilename) : getWebpackRequire(context, options, filename, resolved)
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
