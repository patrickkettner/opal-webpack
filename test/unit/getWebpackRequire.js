'use strict'

const expect = require('expect.js')
const getWebpackRequire = require('../../lib/getWebpackRequire')

describe('getWebpackRequire', function(){
  const baseOptions = {
    currentLoader: 'the_loader'
  }

  it('returns require', function() {
    var result = getWebpackRequire(baseOptions, 'some/path', '/the/some/path')

    expect(result).to.be("require('!!the_loader?file=some%2Fpath&requirable=true!/the/some/path');")
  })

  it('does not pass everything in the query', function() {
    var options = {
      sourceRoot: 'foo',
      filename: 'foo',
      sourceMap: 'foo',
      relativeFileName: 'bar',
      stubs: 'bar',
      yes: 'yes'
    }
    Object.assign(options, baseOptions)

    var result = getWebpackRequire(options, 'some/path', '/the/some/path')

    expect(result).to.be("require('!!the_loader?yes=yes&file=some%2Fpath&requirable=true!/the/some/path');")
  })
})
