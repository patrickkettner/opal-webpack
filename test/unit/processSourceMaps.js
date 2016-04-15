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

  function getSourceMap(ruby, prepend) {
    prepend = prepend || []
    const targetOptions = {
      relativeFileName: 'foo.rb'
    }
    const compiler = getCompiler(ruby, targetOptions)
    compiler.$compile()
    const result = compiler.$result()
    return require('../../lib/processSourceMaps')(compiler, ruby, '/the/path/to/foo.rb', result, prepend)
  }

  it('no requires', function() {
    const ruby = 'def hello\n123\nend'

    const map = getSourceMap(ruby)

    expect(map.version).to.eq(3)
    expect(map.sources).to.have.length(1)
    expect(map.sources[0]).to.eq('/the/path/to/foo.rb')
    expect(map.sourcesContent).to.have.length(1)
    expect(map.sourcesContent[0]).to.eq(ruby)
    const smc = new SourceMapConsumer(map)

    const sourcePosition = smc.originalPositionFor({
      line: opalVersionFetcher.isOpal010() ? 8 : 10,
      column: 5
    })
    expect(sourcePosition.line).to.eq(2)
    expect(sourcePosition.column).to.eq(0)
    // no names before 0.10
    if (opalVersionFetcher.isOpal010()) {
      expect(sourcePosition.name).to.eq('hello')
    }
  })

  it('with requires prepended', function() {
    const ruby = 'def hello\n123\nend'
    const prepends = ['webpack_require_here();']
    const withRequires = prepends.join(' ') + '\n' + ruby

    const map = getSourceMap(withRequires, prepends)

    expect(map.version).to.eq(3)
    expect(map.sources).to.have.length(1)
    expect(map.sources[0]).to.eq('/the/path/to/foo.rb')
    expect(map.sourcesContent).to.have.length(1)
    expect(map.sourcesContent[0]).to.eq(withRequires)
    const smc = new SourceMapConsumer(map)

    const sourcePosition = smc.originalPositionFor({
      line: opalVersionFetcher.isOpal010() ? 8 : 10,
      column: 5
    })
    expect(sourcePosition.line).to.eq(2)
    expect(sourcePosition.column).to.eq(0)
    // no names before 0.10
    if (opalVersionFetcher.isOpal010()) {
      expect(sourcePosition.name).to.eq('hello')
    }
  })
})
