var path = require("path")

module.exports = {
  entry: './main.rb',
  output: {
    filename: 'bundle.js'       
  },
  module: {
    loaders: [
      { 
        test: /\.rb$/, 
        loader: "opal-webpack",
      }
    ]
  }
};
