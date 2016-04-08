'use strict'

const expect = require('expect.js')
const queryString = require('querystring')

describe('Opal loader', function(){
  const loader = require('../index')
  const dummyLoader = {
    path: 'the_loader_path'
  }
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
      callback: callback
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

  describe('webpack requires', function() {
    it('standard', function(done) {
      const callback = function (err, result) {
        expect(result).to.match(/require\('!!the_loader_path\?cacheIdentifier=.*&file=another_dependency&requirable=true!.*\/test\/fixtures\/another_dependency\.rb'\);/)
        done()
      }

      callLoader(callback, 'require "another_dependency"')
    })

    it('require relative', function(done) {
      const callback = function (err, result) {
        expect(result).to.match(/require\('!!the_loader_path\?cacheIdentifier=.*&file=another_dependency&requirable=true!.*\/test\/fixtures\/another_dependency\.rb'\);/)
        done()
      }

      callLoader(callback, 'require_relative "another_dependency"')
    })

    it('node convention', function(done) {
      const callback = function (err, result) {
        expect(result).to.match(/require\('!!the_loader_path\?cacheIdentifier=.*&file=\.%2Fanother_dependency&requirable=true!.*\/test\/fixtures\/another_dependency\.rb'\);/)
        done()
      }

      callLoader(callback, 'require "./another_dependency"')
    })

    it('require_relative with leading dot', function(done) {
      const callback = function (err, result) {
        expect(result).to.match(/require\('!!the_loader_path\?cacheIdentifier=.*&file=\.%2Fanother_dependency&requirable=true!.*\/test\/fixtures\/another_dependency\.rb'\);/)
        done()
      }

      callLoader(callback, 'require_relative "./another_dependency"')
    })

    it('JS require', function(done) {
      const callback = function (err, result) {
        expect(result).to.match(/require\('.*imports-loader\/index.js!.*test\/fixtures\/pure_js.js'\);/)
        done()
      }

      callLoader(callback, 'require "pure_js"')
    })
  })

  describe('stubbed module declarations', function() {
    it('via require', function(done) {
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

    it('via require_relative', function(done) {
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

      callLoader(callback, 'require_relative "stubbed"; HELLO=123', null, options)
    })

    it('via node conventions', function(done) {
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

      callLoader(callback, 'require "./stubbed"; HELLO=123', null, options)
    })

    it('do not leak compile state', function(done) {
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

      const queryOptions = {
        file: 'foobar'
      }

      callLoader(callback, 'require "stubbed"; HELLO=123', queryOptions, options)
    })

    it('do not leak stub config itself', function(done) {
      const callback = function (err, result) {
        expect(result).to.not.match(/require\('!!the_loader_path.*?stubs.*'\);/)
        done()
      }

      const options = {
        opal: {
          stubs: ['stubbed']
        }
      }

      callLoader(callback, 'require "another_dependency"', null, options)
    })
  })

  describe('Opal require statements', function() {
    it('node conventions', function (done) {
      const callback = function (err, result) {
        expect(result).to.match(/self.\$require\("a_file"\)/)
        done()
      }

      const options = {
        opal: {
          stubs: ['a_file']
        }
      }

      callLoader(callback, 'require "./a_file"', null, options)
    })

    it('standard require', function (done) {
      const callback = function (err, result) {
        expect(result).to.match(/self.\$require\("a_file"\)/)
        done()
      }

      const options = {
        opal: {
          stubs: ['a_file']
        }
      }

      callLoader(callback, 'require "a_file"', null, options)
    })

    it('require relative', function (done) {
      const callback = function (err, result) {
        expect(result).to.match(/self.\$require\("a_file"\)/)
        done()
      }

      const options = {
        opal: {
          stubs: ['a_file']
        }
      }

      callLoader(callback, 'require_relative "a_file"', null, options)
    })

    it('require relative with leading dot', function (done) {
      const callback = function (err, result) {
        expect(result).to.match(/self.\$require\("a_file"\)/)
        done()
      }

      const options = {
        opal: {
          stubs: ['a_file']
        }
      }

      callLoader(callback, 'require_relative "./a_file"', null, options)
    })
  })

  context('requireable', function (done) {
    it('standard', function(done) {
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

    it('require_relative', function(done) {
      const callback = function (err, result) {
        expect(result).to.match(/Opal.cdecl\(\$scope, 'HELLO', 123\)/)
        expect(result).to.match(/Opal.modules\["dependency\/foo"\]/)
        done()
      }

      const queryOptions = {
        requirable: true,
        file: 'dependency/foo'
      }

      callLoader(callback, 'HELLO=123', queryOptions)
    })

    it('node conventions', function(done) {
      const callback = function (err, result) {
        expect(result).to.match(/Opal.cdecl\(\$scope, 'HELLO', 123\)/)
        expect(result).to.match(/Opal.modules\["dependency"\]/)
        done()
      }

      const queryOptions = {
        requirable: true,
        file: './dependency'
      }

      callLoader(callback, 'HELLO=123', queryOptions)
    })
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
