'use strict'

const env = process.env
// avoid firing up Ruby just to check this
const rubyOpt = env.RUBYOPT
const bundlerRunning = typeof rubyOpt !== 'undefined' && rubyOpt.indexOf('-rbundler/setup') != -1

const useBundler = bundlerRunning && env.OPAL_USE_BUNDLER !== 'false'

module.exports = function() {
  return useBundler
}
