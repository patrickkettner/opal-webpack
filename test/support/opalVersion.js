'use strict'

module.exports = {
  getVersion: function() {
    return require('../../lib/opal').get('RUBY_ENGINE_VERSION')
  },
  isOpal010: function() {
    return require('../../lib/opal').get('RUBY_ENGINE_VERSION').indexOf('0.10') != -1
  }
}
