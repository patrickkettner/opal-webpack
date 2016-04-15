'use strict'

const expect = require('chai').expect
const cleanScopeAndRequire = require('../support/cleanScopeAndRequire')
const sourceMap = require('source-map')
const SourceMapConsumer = sourceMap.SourceMapConsumer

const opalVersionFetcher = require('../support/opalVersion')

describe('processSourceMaps', function(){
  beforeEach(cleanScopeAndRequire)

  function getCompiler(source, targetOptions) {
    return require('../../lib/getCompiler')(source, targetOptions)
  }

  function getGeneratedSource(prepends) {
    return prepends.join(' ') + '\n'
  }

  function getSourceMap(ruby, prepend) {
    prepend = prepend || []
    const targetOptions = {
      relativeFileName: 'foo.rb'
    }
    const compiler = getCompiler(ruby, targetOptions)
    compiler.$compile()
    const result = compiler.$result()
    const generatedSource = getGeneratedSource(prepend)
    const map = require('../../lib/processSourceMaps')(compiler, ruby, '/the/path/to/foo.rb', result, generatedSource)
    return {
      compiled: generatedSource + result,
      map: map
    }
  }

  function getCompiledLineNumber(results, blurb) {
    var raiseLineNumber = null
    results.compiled.split('\n').forEach((line, index) => {
      if (line.indexOf(blurb) != -1) {
        raiseLineNumber = index + 1 // 1 based index
      }
    })
    expect(raiseLineNumber).to.not.be.null
    return raiseLineNumber
  }

  function getOriginalInfo(results, blurb, column) {
     const smc = new SourceMapConsumer(results.map)
     return smc.originalPositionFor({
      line: getCompiledLineNumber(results, blurb),
      column: column
    })
  }

  function commonAssert(results, ruby) {
    const map = results.map
    expect(map.version).to.eq(3)
    expect(map.sources).to.have.length(1)
    expect(map.sources[0]).to.eq('/the/path/to/foo.rb')
    expect(map.sourcesContent).to.have.length(1)
    expect(map.sourcesContent[0]).to.eq(ruby)
  }

  it('no requires', function() {
    const ruby = 'def hello\n123\nend'

    const results = getSourceMap(ruby)

    commonAssert(results, ruby)
    const sourcePosition = getOriginalInfo(results, '123', 5)
    expect(sourcePosition.line).to.eq(2)
    expect(sourcePosition.column).to.eq(0)
    // no names before 0.10
    if (opalVersionFetcher.isOpal010()) {
      expect(sourcePosition.name).to.eq('hello')
    }
  })

  it('with requires prepended', function() {
    const ruby = 'require \'dependency\'\n\ndef hello\n   raise \'source map location\'\nend\n\nhello\n'
    const prepends = ['process = undefined;', 'webpack_require_here();']

    const results = getSourceMap(ruby, prepends)

    commonAssert(results, ruby)

    const sourcePosition = getOriginalInfo(results, 'self.$raise', 5)
    expect(sourcePosition.line).to.eq(4)
    expect(sourcePosition.column).to.eq(3)
    // no names before 0.10
    if (opalVersionFetcher.isOpal010()) {
      expect(sourcePosition.name).to.eq('hello')
    }
  })
})
