'use strict'

const path = require('path')
const queryString = require('querystring')

const resolveFilename = require('./resolveFilename')
const processSourceMaps = require('./processSourceMaps')

function getCompiler(source, options) {
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

function filterNonQueryPassOptions(options) {
  const passOnOptions = Object.assign({}, options)
  delete passOnOptions.sourceRoot
  delete passOnOptions.currentLoader
  delete passOnOptions.filename
  delete passOnOptions.sourceMap
  delete passOnOptions.relativeFileName
  // stubs are global, do not want to locally override these
  delete passOnOptions.stubs
  return passOnOptions
}

function addToWebpack(options, filename, prepend, resolved) {
  const passOnOptions = filterNonQueryPassOptions(options)
  Object.assign(passOnOptions, {
    file: filename,
    requirable: true
  })
  const flat = queryString.stringify(passOnOptions)
  prepend.push(`require('!!${options.currentLoader}?${flat}!${resolved}');`)
}

function compileStub(options, filename, prepend) {
  const compilerOptions = filterNonQueryPassOptions(options)
  Object.assign(compilerOptions, {
    relativeFileName: filename,
    requirable: true
  })
  // if a stub is require'ed in a require'ed file, then file will be present and will override
  // the stubbed filename we're supplying
  delete compilerOptions.file
  const compiler = getCompiler('', compilerOptions)
  compiler.$compile()
  prepend.push(compiler.$result())
}

module.exports = function transpile(source, options) {
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
        prepend.push(`require('${require.resolve('imports-loader')}!${resolved}');`)
        prepend.push(`Opal.loaded('${filename}');`)
      } else {
        if (isStub) {
          compileStub(options, filename, prepend)
        }
        else {
          addToWebpack(options, filename, prepend, resolved)
        }
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
