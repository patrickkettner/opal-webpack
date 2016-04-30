'use strict'

const path = require('path')

const loaderPath = require.resolve('../index')

module.exports = {
  entry: path.resolve(__dirname, 'entry_point.js'),
  output: {
    path: __dirname,
    filename: '[id].loader.js'
  },
  module: {
    loaders: [{
      test: /\.rb$/,
      loader: loaderPath
    }]
  }
}
