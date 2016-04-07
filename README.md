# opal-webpack
> Opal is a compiler for writing JavaScript in Ruby.

This package allows transpiling Ruby files using [Opal](http://opalrb.org) and [webpack](https://github.com/webpack/webpack).

Check out [this blog post](https://medium.com/@cj/from-sprockets-to-webpack-5f3d1afbd1b0) if you are interested in the project background.

[![npm version](https://img.shields.io/npm/v/opal-webpack.svg?style=flat-square)](https://www.npmjs.com/package/opal-webpack)
[![npm downloads](https://img.shields.io/npm/dt/opal-webpack.svg?style=flat-square)](https://www.npmjs.com/package/opal-webpack)
[![Circle CI](https://circleci.com/gh/cj/opal-webpack.svg?style=svg)](https://circleci.com/gh/cj/opal-webpack)

## Installation

```bash
npm install opal-webpack --save-dev
```

## Usage

[Documentation: Using loaders](http://webpack.github.io/docs/using-loaders.html)

```javascript
// webpack.config.js 
module: {
  loaders: [
    {
      test: /\.rb?$/,
      loader: 'opal-webpack'
    }
  ]
}
```

### Options

See `Opal::Compiler` [options](https://github.com/opal/opal/blob/master/lib/opal/compiler.rb) for possible options.

```javascript
// webpack.config.js 
module: {
  loaders: [
    {
      test: /\.rb?$/,
      loader: 'opal-webpack',
      query: {
        requirable: false,
        freezing: false,
      }
    }
  ]
}
```

#### OPAL_LOAD_PATH

By passing `OPAL_LOAD_PATH` environment variable to webpack, the loader will correctly resolve file other than relative path.

`opal-webpack` is only bundled with compiler module. It left the decision on managing runtime, corelib or gems to developer. 

See the example [Rakefile](https://github.com/cj/opalrb-loader/blob/master/examples/complex/Rakefile) for how to integrate using other Opal gems. 

### Compared to `Opal::Builder`
* Relative `require` is correctly resolved.
* `require_trees` is **not yet implemented**.
* erb is not supported (which should be implemented as separate loader).

### Known issues
* First time compiling is relatively slow compared to Ruby one, use `--watch` option for webpack to speed up dev iteration.
* Use `require` to load JS file is broken, but you can write as below to load JS module (webpack will correctly resolve it).
```ruby
# Inside ruby file
`var $ = require("jquery")`
```
* **stdlib** and some gems may not be correctly compiled, please file an issue if you encounter one.

### Examples

It's under [Examples](https://github.com/cj/opal-webpack/tree/master/examples) folder.

* simple: Basic setup without further dependency.
* complex: Compile opal/corelib and other gems.

## Development

* `npm install`
* `npm run build_compiler` to build compiler
* `npm start` to compile & watch `index.es6.js`

## Contact

[CJ Lazell](http://github.com/cj)
[@ceej](https://twitter.com/cj)

## License

Available under the MIT license. See the LICENSE file for more info.

### This wouldn't be possible without [David Chang](https://github.com/zetachang)
