'use strict'

const execSync = require('child_process').execSync
const env = process.env

const useBundler = require('./bundlerCheck')()
const bundlerExecute = require('./bundlerExecute')
const opalVersion = require('./getOpalVersion')

function getRubyOutput(mriRequires) {
  const stubCode = opalVersion.indexOf('0.9') == -1 ? 'Opal::Config.stubbed_files' : 'Opal::Processor.stubbed_files'
  const flatRequires = mriRequires.map(req => `require '${req}'`).join(';')
  const mriPathsVariable = env.RAILS_ENV ? 'Rails.application.assets.paths' : 'Opal.paths'
  const rubyCode = `${flatRequires}; puts({loadPath: ${mriPathsVariable}, stubs: ${stubCode}.to_a}.to_json)`

  if (useBundler) {
    if (env.RAILS_ENV) {
      // using rails runner to try and take advantage of spring
      return bundlerExecute(`rails runner "${rubyCode}"`)
    }
    else {
      return bundlerExecute(`ruby -e "require 'opal'; ${rubyCode}"`)
    }
  }
  else if (mriRequires.length > 0) {
    return execSync(`ruby -e "${rubyCode}"`)
  }
  return null
}

function getMetadata() {
  const loadPath = env.OPAL_LOAD_PATH ? env.OPAL_LOAD_PATH.split(':') : [process.cwd()]

  const metadata = {
    loadPath: loadPath,
    stubs: []
  }

  const mriRequires = env.OPAL_MRI_REQUIRES ? env.OPAL_MRI_REQUIRES.split(':') : []
  const rubyOutput = getRubyOutput(mriRequires)

  if (rubyOutput) {
    const rubyMetadata = JSON.parse(rubyOutput.toString())
    metadata.loadPath = rubyMetadata.loadPath.concat(metadata.loadPath)
    metadata.stubs = rubyMetadata.stubs
  }

  if (loadPath.length === 0) {
    console.warn('OPAL_LOAD_PATH environment variable is not set')
    console.warn('By default, loader will only load from path relative to current source')
  }

  return metadata
}

module.exports = getMetadata()
