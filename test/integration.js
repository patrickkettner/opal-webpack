'use strict';

const assert = require('assert');
const rimraf = require('rimraf');
const assign = require('object-assign');
const expect = require('expect.js');
const mkdirp = require('mkdirp');
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const execSync = require('child_process').execSync;
const fsExtra = require('fs-extra');

RegExp.escape = function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

describe('Opal loader', function(){
  const currentDirectoryExp = new RegExp(RegExp.escape(process.cwd()))
  const dependencyMain = './test/fixtures/dependency.rb'
  const dependencyBackup = './test/fixtures/dependency.rb.backup'
  const opalLoader = path.resolve(__dirname, '../');
  const outputDir = path.resolve(__dirname, './output/loader');
  const globalConfig = {
      output: {
        path: outputDir,
        filename: '[id].loader.js',
      },
      module: {
        loaders: [{ test: /\.rb$/, loader: opalLoader }],
      },
    };

  function assertBasic(config, done) {
    webpack(config, (err, stats) => {
      expect(err).to.be(null);
      let errors = stats.compilation.errors
      if (errors.length > 0) {
        console.dir(errors[0].stack)
      }
      expect(errors).to.be.empty()

      fs.readdir(outputDir, (err, files) => {
        expect(err).to.be(null);
        expect(files.length).to.equal(1);
        fs.readFile(path.resolve(outputDir, files[0]), (err, data) => {
          var subject = data.toString();

          expect(err).to.be(null);
          expect(subject).to.match(/Opal\.cdecl\(\$scope, 'HELLO', 123\)/);
          expect(subject).to.not.match(currentDirectoryExp)
          expect(subject).to.match(/Opal\.modules\["dependency"\]/)

          return done();
        });
      })
    });
  }

  beforeEach(function (done) {
    fsExtra.copySync(dependencyMain, dependencyBackup, {clobber: true})
    rimraf(outputDir, function(err) {
      if (err) { return done(err); }
      mkdirp(outputDir, done);
    });
  });

  afterEach(function (done) {
    // cleanup
    fsExtra.copy(dependencyBackup, dependencyMain, {clobber: true}, done)
  })

  it("loads basic files", function (done) {
    const config = assign({}, globalConfig, {
      entry: './test/fixtures/basic.js'
    });
    assertBasic(config, done)
  });

  it("loads requires", function (done){
    const config = assign({}, globalConfig, {
      entry: './test/fixtures/requires.js'
    });
    webpack(config, (err, stats) => {
      expect(err).to.be(null);
      expect(stats.compilation.errors).to.be.empty()

      fs.readdir(outputDir, (err, files) => {
        expect(err).to.be(null);
        expect(files.length).to.equal(1);
        fs.readFile(path.resolve(outputDir, files[0]), (err, data) => {
          var subject = data.toString();

          expect(err).to.be(null);
          expect(subject).to.match(/Opal\.cdecl\(\$scope, 'HELLO', 123\)/);
          expect(subject).to.match(/Opal\.cdecl\(\$scope, 'INSIDE', 789\)/);
          expect(subject).to.not.match(currentDirectoryExp)

          return done();
        });
      })
    });
  });

  it.only("loads require_tree", function (done) {
    const config = assign({}, globalConfig, {
      entry: './test/fixtures/tree.js'
    });
    webpack(config, (err, stats) => {
      expect(err).to.be(null);
      expect(stats.compilation.errors).to.be.empty()

      fs.readdir(outputDir, (err, files) => {
        expect(err).to.be(null);
        expect(files.length).to.equal(1);
        fs.readFile(path.resolve(outputDir, files[0]), (err, data) => {
          var subject = data.toString();

          expect(err).to.be(null);
          expect(subject).to.match(/Opal\.cdecl\(\$scope, 'HELLO', 123\)/);
          expect(subject).to.match(/Opal\.cdecl\(\$scope, 'THERE', 456\)/);
          expect(subject).to.not.match(currentDirectoryExp)
          expect(subject).to.match(/\$require_tree\("tree"\)/)
          expect(subject).to.match(/Opal\.modules\["tree\/file1"\]/)
          expect(subject).to.match(/Opal\.modules\["tree\/file2"\]/)

          return done();
        });
      })
    });
  });

  it("loads require_relative", function (done) {
    const config = assign({}, globalConfig, {
      entry: './test/fixtures/relative.js'
    });
    webpack(config, (err, stats) => {
      expect(err).to.be(null);
      expect(stats.compilation.errors).to.be.empty()

      fs.readdir(outputDir, (err, files) => {
        expect(err).to.be(null);
        expect(files.length).to.equal(1);
        fs.readFile(path.resolve(outputDir, files[0]), (err, data) => {
          var subject = data.toString();

          expect(err).to.be(null);
          expect(subject).to.match(/Opal\.cdecl\(\$scope, 'HELLO', 123\)/);
          // don't want paths hard coded to machines in here
          expect(subject).to.not.match(currentDirectoryExp)

          return done();
        });
      })
    });
  });

  it("reloads dependencies", function (done) {
    this.timeout(6000)
    const config = assign({}, globalConfig, {
      entry: './test/fixtures/requires.js'
    });
    webpack(config, (err, stats) => {
      expect(err).to.be(null)
      expect(stats.compilation.errors).to.be.empty()
      fs.writeFileSync(dependencyMain, 'HELLO=456')
      setTimeout(() => {
        fs.readdir(outputDir, (err, files) => {
          expect(err).to.be(null);
          expect(files.length).to.equal(1);
          fs.readFile(path.resolve(outputDir, files[0]), (err, data) => {
            var subject = data.toString();

            expect(err).to.be(null);
            expect(subject).to.match(/Opal\.cdecl\(\$scope, 'HELLO', 123\)/);

            return done();
          })
        })
      }, 3000)
    });
  });

  it("outputs correct source maps", function (done) {
    this.timeout(10000);
    execSync("bundle exec opal -c -e \"require 'opal'\" > test/output/loader/opal.js");

    const config = assign({}, globalConfig, {
      entry: './test/fixtures/source_maps.js',
      devtool: 'source-map'
    });
    webpack(config, (err, stats) => {
      expect(err).to.be(null);
      expect(stats.compilation.errors).to.be.empty()

      fs.readdir(outputDir, (err, files) => {
        expect(err).to.be(null);
        expect(files.length).to.equal(3);
        var output = execSync("node -r ./test/output/loader/opal.js -r ./test/fixtures/load_source_maps.js ./test/output/loader/0.loader.js 2>&1 || true").toString()
        // ruby output, might need some more work since we're 1 line off
        // expecting test/fixtures/source_maps.rb:4:in `hello': source map location (RuntimeError)
        expect(output).to.match(/test\/output\/loader\/webpack:\/test\/fixtures\/source_maps\.rb:3:1\)/)
        expect(output).to.match(/test\/output\/loader\/webpack:\/test\/fixtures\/source_maps.rb:7:1\)/)
        return done();
      })
    });
  });

  xit("handles a file not found error", function (done) {

  });

  it("handles errors", function (done) {
    const config = assign({}, globalConfig, {
      entry: './test/fixtures/error.js'
    });
    webpack(config, (err, stats) => {
      let errors = stats.compilation.errors
      expect(errors.length).to.be(1)
      let error = errors[0]
      expect(error).to.be.an(Error)
      expect(error.message).to.match(/Module build failed.*An error occurred while compiling:.*error\.rb[\s\S]+3:0/)
      return done()
    });
  });

  xit("allows caching to a specific directory", function (done) {
    const cacheDir = 'test/output/cache'
    const config = assign({}, globalConfig, {
      entry: './test/fixtures/basic.js',
      module: {
        loaders: [
          {
            test: /\.rb$/,
            loader: opalLoader,
            query: {
              cacheDirectory: cacheDir
            }
          }
        ],
      },
    });
    assertBasic(config, () => {
      // run again and use the cache
      assertBasic(config, () => {
        fs.readdir(cacheDir, (err, files) => {
          expect(err).to.be(null);
          expect(files).to.have.length(3);
          return done();
        })
      })
    })
  });

  xit("expires the cache properly", function (done) {
  });

  xit("allows caching with a custom identifier", function (done) {
  });

  xit("allows caching with a default directory", function (done) {
  });
});
