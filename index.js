'use strict';

require("./vendor/opal-compiler.js")
const loaderUtils = require('loader-utils')
const sourceMap = require('source-map')
const SourceNode = sourceMap.SourceNode
const SourceMapConsumer = sourceMap.SourceMapConsumer
const SourceMapGenerator = sourceMap.SourceMapGenerator
const path = require('path')
const fs = require('fs')
const pkg = require('./package.json')
//const cache = require('./lib/fs-cache.js')

const opalVersion = Opal.get('RUBY_ENGINE_VERSION')
const LOAD_PATH = process.env.OPAL_LOAD_PATH ? process.env.OPAL_LOAD_PATH.split(":") : [process.cwd()];

if (LOAD_PATH.length === 0) {
  console.warn("OPAL_LOAD_PATH environment variable is not set")
  console.warn("By default, loader will only load from path relative to current source")
}

function getCurrentLoader(loaderContext) {
  return loaderContext.loaders[loaderContext.loaderIndex];
}

function resolveFilename(filename) {
  let rubyFileName = filename.replace(/(\.rb)?$/, ".rb");

  // FIXME
  // Workaround to make "require 'opal'" work, original opal will try to concate raw js
  if (filename == 'corelib/runtime') {
    rubyFileName = 'corelib/runtime.js'
  }

  let result = null;
  // opal only looks  @ the load path, so that's what we'll do
  for (var dir of LOAD_PATH) {
    let fullPath = path.resolve(dir, rubyFileName);
    if (fs.existsSync(fullPath)) {
      result = {
        absolute: fullPath,
        relative: path.relative(dir, rubyFileName)
      }
      break;
    }
  }

  if (result) {
    return result;
  } else {
    throw new Error(`Cannot load file - ${filename}`);
  }
}

function getCompiler(source, options) {
  // it's important to not give an absolute path to Opal (only relative to load path)
  // otherwise absolute paths end up in the compiled code
  const relativePath = options.relativeFileName
  // don't want Opal.modules to have an extension
  console.log(`compiler, trying to trim ${path.extname(relativePath)} off ${relativePath}`)
  const withoutExtension = relativePath.replace(path.extname(relativePath), '')
  console.log(`compiler, got ${withoutExtension}`)
  const compilerOptions = Object.assign({
    file: withoutExtension, // opal calls it file
  }, options);
  delete compilerOptions.filename
  return Opal.Opal.Compiler.$new(source, Opal.hash(compilerOptions));
}

function processSourceMaps(compiler, source, resourcePath, rawResult, prepend) {
  let rawMap = JSON.parse(compiler.$source_map().$as_json().$to_json());

  // Since it's compiled from the current resource
  rawMap.sources = [resourcePath];

  // Set source content
  let consumer = new SourceMapConsumer(rawMap)
  let map = SourceMapGenerator.fromSourceMap(consumer);
  map.setSourceContent(resourcePath, source);

  // Prepend the chunk of our injected script
  let node = SourceNode.fromStringWithSourceMap(rawResult, new SourceMapConsumer(map.toString()));
  node.prepend(prepend.join(" "));
  return JSON.parse(node.toStringWithSourceMap().map.toString())
}

function transpile(source, options) {
  const compiler = getCompiler(source, options)

  compiler.$compile();

  const result = compiler.$result();

  /*
    Workaround to make IO work,
    webpack polyfill global "process" module by default,
    while Opal::IO rely on it to deterimine in node environment or not
  */
  let prepend = ['process = undefined;'];

  const addRequires = files => {
    files.forEach(filename => {
      console.log(`handling require ${filename}`)
      var resolved = resolveFilename(filename).absolute;
      if (resolved.match(/\.js$/)) {
        prepend.push(`require('${require.resolve('imports-loader')}!${resolved}');`);
        prepend.push(`Opal.loaded('${filename}');`)
      } else {
        prepend.push(`require('!!${options.currentLoader}?file=${filename}&requirable=true!${resolved}');`);
      }
    })
  }

  addRequires(compiler.$requires())

  compiler.$required_trees().forEach(function (dirname) {
    // path will only be relative to the file we're processing
    let resolved = path.resolve(options.filename, '..', dirname)
    console.log(`require trees from ${dirname} to ${resolved}`)
    // TODO: Look into making this async
    let files = fs.readdirSync(resolved)
    let withPath = []
    // fs.readdir only returns the filenames, not the base directory
    files.forEach(function (filename) { withPath.push(path.join(dirname, filename)) })
    addRequires(withPath)
  })

  let response = {
    code: prepend.join(" ") + "\n" + result
  }
  if (options.sourceMap) {
    response.map = processSourceMaps(compiler, source, options.filename, result, prepend)
  }
  return response
}

module.exports = function(source) {
  var result = {}

  const webpackRemainingChain = loaderUtils.getRemainingRequest(this).split('!');
  const filename = webpackRemainingChain[webpackRemainingChain.length - 1];
  const globalOptions = this.options.opal || {};
  const loaderOptions = loaderUtils.parseQuery(this.query);
  const userOptions = Object.assign({}, globalOptions, loaderOptions);
  const relativeFileName = resolveFilename(filename).relative
  const defaultOptions = {
    sourceRoot: process.cwd(),
    currentLoader: getCurrentLoader(this).path,
    filename: filename,
    relativeFileName: relativeFileName,
    cacheIdentifier: JSON.stringify({
      'opal-loader': pkg.version,
      'opal-compiler': opalVersion,
      env: process.env.OPAL_ENV || process.env.NODE_ENV,
    }),
  }
  const options = Object.assign({}, defaultOptions, userOptions)

  if (userOptions.sourceMap === undefined) {
    options.sourceMap = this.sourceMap
  }

  const cacheDirectory = options.cacheDirectory
  const cacheIdentifier = options.cacheIdentifier

  delete options.cacheDirectory
  delete options.cacheIdentifier

  this.cacheable()

  if (cacheDirectory) {
    var callback = this.async();
    return cache({
      directory: cacheDirectory,
      identifier: cacheIdentifier,
      source: source,
      options: options,
      transform: transpile,
    }, function(err, result) {
      if (err) { return callback(err); }
      return callback(null, result.code, result.map);
    });
  }
  result = transpile(source, options);
  this.callback(null, result.code, result.map);
};
