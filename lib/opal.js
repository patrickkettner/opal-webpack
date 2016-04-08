// allow watch unit testing more easily
if (typeof Opal === 'undefined') {
  require('../vendor/opal-compiler.js')
}

module.exports = Opal
