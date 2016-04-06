'use strict'

const expect = require('expect.js')
const queryString = require('querystring')

describe('Opal loader', function(){
  const loader = require('../index')
  const dummyLoader = {}
  const defaultContext = {
    cacheable: function() {},
    loaders: [dummyLoader],
    options: {},
    loaderIndex: 0,
    resource: ['dependency.rb'] // just needs to be a dummy file that exists for now
  }

  function callLoader(callback, code, queryOptions, loaderOptions) {
    let contextOverride = {}
    if (queryOptions) {
      contextOverride.query = '?' + queryString.stringify(queryOptions)
    }
    if (loaderOptions) {
      contextOverride.options = loaderOptions
    }
    const context = Object.assign({}, defaultContext, contextOverride, {
      callback: callback,
    })
    loader.call(context, code)
  }

  it('compiles an endpoint', function(done) {
    const callback = function (err, result) {
      expect(result).to.match(/Opal.cdecl\(\$scope, 'HELLO', 123\)/)
      expect(result).to.not.match(/Opal.modules/)
      done()
    }

    callLoader(callback, 'HELLO=123')
  })

  it('emits requires', function(done) {
    const callback = function (err, result) {
      expect(result).to.match(/require\('!!undefined\?cacheIdentifier=.*&file=another_dependency&requirable=true!.*\/test\/fixtures\/another_dependency\.rb'\);/)
      expect(result).to.not.match(/Opal.modules/)
      done()
    }

    callLoader(callback, 'require "another_dependency"')
  })

  it('allows stubs', function(done) {
    const callback = function (err, result) {
      expect(result).to.match(/Opal.cdecl\(\$scope, 'HELLO', 123\)/)
      expect(result).to.match(/Opal.modules\["stubbed"\]/)
      done()
    }

    const options = {
      opal: {
        stubs: ['stubbed']
      }
    }

    callLoader(callback, 'require "stubbed"; HELLO=123', null, options)
  })

  it('obeys requireable', function(done) {
    const callback = function (err, result) {
      expect(result).to.match(/Opal.cdecl\(\$scope, 'HELLO', 123\)/)
      expect(result).to.match(/Opal.modules\["dependency"\]/)
      done()
    }

    const queryOptions = {
      requirable: true
    }

    callLoader(callback, 'HELLO=123', queryOptions)
  })

  it('handles a JS require', function(done) {
    const callback = function (err, result) {
      expect(result).to.match(/require\('.*imports-loader\/index.js!.*test\/fixtures\/pure_js.js'\);/)
      done()
    }

    callLoader(callback, 'require "pure_js"')
  })

  it('uses compile options', function(done) {
    const callback = function (err, result) {
      expect(result).to.match(/Opal.cdecl\(\$scope, 'HELLO', 123\)/)
      expect(result).to.match(/OPAL_CONFIG.*arity_check: true/)
      expect(result).to.not.match(/Opal.modules/)
      done()
    }

    const queryOptions = {
      arity_check: true
    }

    callLoader(callback, 'HELLO=123', queryOptions)
  })
})
