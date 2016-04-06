'use strict'

const rimraf = require('rimraf')
const assign = require('object-assign')
const expect = require('expect.js')
const mkdirp = require('mkdirp')
const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const execSync = require('child_process').execSync
const fsExtra = require('fs-extra')

RegExp.escape = function(s) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}

describe('Opal loader', function(){
  const currentDirectoryExp = new RegExp(RegExp.escape(process.cwd()))
  const dependencyMain = './test/fixtures/dependency.rb'
  const dependencyBackup = './test/fixtures/dependency.rb.backup'
  const opalLoader = path.resolve(__dirname, '../')
  const outputBaseDir = path.resolve(__dirname, 'output')
  const outputDir = path.resolve(outputBaseDir, 'loader')
  const globalConfig = {
    output: {
      path: outputDir,
      filename: '[id].loader.js'
    },
    module: {
      loaders: [{ test: /\.rb$/, loader: opalLoader }]
    }
  }

  function assertBasic(config, done) {
    webpack(config, (err, stats) => {
      expect(err).to.be(null)
      let errors = stats.compilation.errors
      if (errors.length > 0) {
        console.dir(errors[0].stack)
      }
      expect(errors).to.be.empty()

      fs.readdir(outputDir, (err, files) => {
        expect(err).to.be(null)
        expect(files.length).to.equal(1)
        fs.readFile(path.resolve(outputDir, files[0]), (err, data) => {
          var subject = data.toString()

          expect(err).to.be(null)
          expect(subject).to.match(/Opal\.cdecl\(\$scope, 'HELLO', 123\)/)
          expect(subject).to.not.match(currentDirectoryExp)
          expect(runCode()).to.be('123\n')

          return done()
        })
      })
    })
  }

  function runCode(otherArgs) {
    fsExtra.mkdirpSync('./tmp')
    const args = otherArgs || ''
    execSync('ls ./tmp/opal.js || bundle exec opal -c -e "require \'opal\'" > ./tmp/opal.js')
    return execSync(`node -r ./tmp/opal.js ${args} ./test/output/loader/0.loader.js 2>&1 || true`).toString()
  }

  beforeEach(function (done) {
    fsExtra.copySync(dependencyMain, dependencyBackup, {clobber: true})
    rimraf(outputBaseDir, function(err) {
      if (err) { return done(err) }
      mkdirp(outputDir, done)
    })
  })

  afterEach(function (done) {
    // cleanup
    fsExtra.copy(dependencyBackup, dependencyMain, {clobber: true}, done)
  })

  it('loads basic files', function (done) {
    const config = assign({}, globalConfig, {
      entry: './test/fixtures/entry_basic.js'
    })
    assertBasic(config, done)
  })

  it('loads requires', function (done){
    const config = assign({}, globalConfig, {
      entry: './test/fixtures/entry_requires.js'
    })
    webpack(config, (err, stats) => {
      expect(err).to.be(null)
      expect(stats.compilation.errors).to.be.empty()

      fs.readdir(outputDir, (err, files) => {
        expect(err).to.be(null)
        expect(files.length).to.equal(1)
        fs.readFile(path.resolve(outputDir, files[0]), (err, data) => {
          var subject = data.toString()

          expect(err).to.be(null)
          expect(subject).to.match(/Opal\.cdecl\(\$scope, 'HELLO', 123\)/)
          expect(subject).to.match(/Opal\.cdecl\(\$scope, 'INSIDE', 789\)/)
          expect(subject).to.not.match(currentDirectoryExp)
          expect(runCode()).to.be('123\nwe made it\n')

          return done()
        })
      })
    })
  })

  it('loads JS requires', function (done) {
    const config = assign({}, globalConfig, {
      entry: './test/fixtures/entry_js_require.js'
    })
    webpack(config, (err, stats) => {
      expect(err).to.be(null)
      expect(stats.compilation.errors).to.be.empty()

      fs.readdir(outputDir, (err, files) => {
        expect(err).to.be(null)
        expect(files.length).to.equal(1)
        fs.readFile(path.resolve(outputDir, files[0]), (err, data) => {
          var subject = data.toString()

          expect(err).to.be(null)
          expect(subject).to.not.match(currentDirectoryExp)
          expect(runCode()).to.be('howdy\nagain\n')

          return done()
        })
      })
    })
  })

  xit('load path / webpack module dir')

  // TODO: Several opal bugs with File.dirname and Path.join that keep this from working
  xit('loads require_tree', function (done) {
    const config = assign({}, globalConfig, {
      entry: './test/fixtures/entry_tree.js'
    })
    webpack(config, (err, stats) => {
      expect(err).to.be(null)
      expect(stats.compilation.errors).to.be.empty()

      fs.readdir(outputDir, (err, files) => {
        expect(err).to.be(null)
        expect(files.length).to.equal(1)
        fs.readFile(path.resolve(outputDir, files[0]), (err, data) => {
          var subject = data.toString()

          expect(err).to.be(null)
          expect(subject).to.match(/Opal\.cdecl\(\$scope, 'HELLO', 123\)/)
          expect(subject).to.match(/Opal\.cdecl\(\$scope, 'THERE', 456\)/)
          expect(subject).to.not.match(currentDirectoryExp)
          expect(subject).to.match(/\$require_tree\("tree"\)/)
          expect(subject).to.match(/Opal\.modules\["tree\/file1"\]/)
          expect(subject).to.match(/Opal\.modules\["tree\/file2"\]/)
          expect(runCode()).to.be('inside the tree\n')

          return done()
        })
      })
    })
  })

  xit('loads require_tree without leading dot', function () {
    // should be same result as loads require_tree
  })

  it('loads require_relative', function (done) {
    const config = assign({}, globalConfig, {
      entry: './test/fixtures/entry_relative.js'
    })
    webpack(config, (err, stats) => {
      expect(err).to.be(null)
      expect(stats.compilation.errors).to.be.empty()

      fs.readdir(outputDir, (err, files) => {
        expect(err).to.be(null)
        expect(files.length).to.equal(1)
        fs.readFile(path.resolve(outputDir, files[0]), (err, data) => {
          var subject = data.toString()

          expect(err).to.be(null)
          expect(subject).to.match(/Opal\.cdecl\(\$scope, 'HELLO', 123\)/)
          // don't want paths hard coded to machines in here
          expect(subject).to.not.match(currentDirectoryExp)
          expect(subject).to.match(/Opal\.modules\["tree\/file1"\]/)
          expect(runCode()).to.be('inside the tree\n')

          return done()
        })
      })
    })
  })

  it('outputs correct source maps', function (done) {
    this.timeout(10000)

    const config = assign({}, globalConfig, {
      entry: './test/fixtures/entry_source_maps.js',
      devtool: 'source-map'
    })
    webpack(config, (err, stats) => {
      expect(err).to.be(null)
      expect(stats.compilation.errors).to.be.empty()

      fs.readdir(outputDir, (err, files) => {
        expect(err).to.be(null)
        expect(files.length).to.equal(2)
        var output = runCode('-r ./test/fixtures/load_source_maps.js')
        // ruby output, might need some more work since we're 1 line off
        // expecting test/fixtures/source_maps.rb:4:in `hello': source map location (RuntimeError)
        expect(output).to.match(/test\/output\/loader\/webpack:\/test\/fixtures\/source_maps\.rb:3:1\)/)
        expect(output).to.match(/test\/output\/loader\/webpack:\/test\/fixtures\/source_maps.rb:7:1\)/)
        return done()
      })
    })
  })

  it('passes compiler args to all files it compiles', function (done) {
    const config = assign({}, globalConfig, {
      entry: './test/fixtures/entry_arity.js',
      module: {
        loaders: [
          {
            test: /\.rb$/,
            loader: opalLoader,
            query: {
              arity_check: true
            }
          }
        ]
      }
    })
    webpack(config, (err, stats) => {
      expect(err).to.be(null)
      expect(stats.compilation.errors).to.be.empty()

      fs.readdir(outputDir, (err, files) => {
        expect(err).to.be(null)
        expect(files.length).to.equal(1)
        fs.readFile(path.resolve(outputDir, files[0]), (err, data) => {
          var subject = data.toString()

          expect(err).to.be(null)
          expect(subject).to.not.match(currentDirectoryExp)
          expect(runCode()).to.be('[Object#onearg] wrong number of arguments(0 for 1)\n[Object#two_arg] wrong number of arguments(1 for 2)\n')

          return done()
        })
      })
    })
  })

  it('handles errors', function (done) {
    const config = assign({}, globalConfig, {
      entry: './test/fixtures/entry_error.js'
    })
    webpack(config, (err, stats) => {
      let errors = stats.compilation.errors
      expect(errors.length).to.be(1)
      let error = errors[0]
      expect(error).to.be.an(Error)
      expect(error.message).to.match(/Module build failed.*An error occurred while compiling:.*error[\s\S]+3:0/)
      return done()
    })
  })

  it('allows caching to a specific directory', function (done) {
    const cacheDir = 'test/output/cache'
    const config = assign({}, globalConfig, {
      entry: './test/fixtures/entry_basic.js',
      module: {
        loaders: [
          {
            test: /\.rb$/,
            loader: opalLoader,
            query: {
              cacheDirectory: cacheDir
            }
          }
        ]
      }
    })
    assertBasic(config, () => {
      // run again and use the cache
      assertBasic(config, () => {
        fs.readdir(cacheDir, (err, files) => {
          expect(err).to.be(null)
          expect(files).to.have.length(1)
          return done()
        })
      })
    })
  })

  it('caches multiple modules', function(done) {
    const cacheDir = 'test/output/cache'
    const config = assign({}, globalConfig, {
      entry: './test/fixtures/entry_requires.js',
      module: {
        loaders: [
          {
            test: /\.rb$/,
            loader: opalLoader,
            query: {
              cacheDirectory: cacheDir
            }
          }
        ]
      }
    })
    webpack(config, (err, stats) => {
      expect(err).to.be(null)
      expect(stats.compilation.errors).to.be.empty()

      fs.readdir(cacheDir, (err, files) => {
        expect(err).to.be(null)
        expect(files).to.have.length(3)
        return done()
      })
    })
  })

  it('caches source maps', function (done) {
    const cacheDir = 'test/output/cache'
    const config = assign({}, globalConfig, {
      entry: './test/fixtures/entry_source_maps.js',
      devtool: 'source-map',
      module: {
        loaders: [
          {
            test: /\.rb$/,
            loader: opalLoader,
            query: {
              cacheDirectory: cacheDir
            }
          }
        ]
      }
    })
    webpack(config, (err, stats) => {
      expect(err).to.be(null)
      expect(stats.compilation.errors).to.be.empty()

      fs.readdir(outputDir, (err, files) => {
        expect(err).to.be(null)
        expect(files.length).to.equal(2)
        var output = runCode('-r ./test/fixtures/load_source_maps.js')
        // ruby output, might need some more work since we're 1 line off
        // expecting test/fixtures/source_maps.rb:4:in `hello': source map location (RuntimeError)
        expect(output).to.match(/test\/output\/loader\/webpack:\/test\/fixtures\/source_maps\.rb:3:1\)/)
        expect(output).to.match(/test\/output\/loader\/webpack:\/test\/fixtures\/source_maps.rb:7:1\)/)
        return done()
      })
    })
  })
})
