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
    resource: ['dependency.rb']
  }

  function callLoader(callback, code, queryOptions) {
    let options = {}
    if (queryOptions) {
      options.query = '?' + queryString.stringify(queryOptions)
    }
    const context = Object.assign({}, defaultContext, options, {
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
