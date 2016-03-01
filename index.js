'use strict';

var path = require('path'),
    fs   = require('fs');

var PACKAGE_NAME = require('./package.json').name;

function OmitTildeWebpackPlugin(options) {
  this.options = (typeof options === 'object') ? options : {};
}
module.exports = OmitTildeWebpackPlugin;

OmitTildeWebpackPlugin.prototype.apply = function apply(compiler) {
  var options  = this.options,
      warnings = [];

  // work out the modules that we need to respond to
  var excludeNames = [].concat(options.exclude)
    .map(String);

  var includeNames = [].concat(options.include)
    .map(String)
    .reduce(eachInclude, []);

  var moduleNames = includeNames
    .filter(testNotExcluded.bind(null, excludeNames));

  // hook the compiler so we can push warnings in the warn() method
  compiler.plugin('after-compile', afterCompile);

  if (moduleNames.length) {
    compiler.resolvers.normal.plugin('directory', directoryResolver);
  } else {
    warn('No dependencies found, plugin will not run');
  }

  function warn() {
    var text = [PACKAGE_NAME]
      .concat(Array.prototype.slice.call(arguments))
      .join(' ');
    if (warnings.indexOf(text) < 0) {
      warnings.push(text);
    }
  }

  function afterCompile(compilation, done) {
    compilation.warnings.push.apply(compilation.warnings, warnings);
    done();
  }

  function eachInclude(reduced, include) {
    if (/\.json$/i.test(include)) {
      var contents;
      try {
        contents = require(path.resolve(include));
      }
      catch (exception) {
        warn('file', include, 'was not found in the working directory');
      }
      return reduced
        .concat(contents && contents.dependencies && Object.keys(contents.dependencies))
        .concat(contents && contents.devDependencies && Object.keys(contents.devDependencies))
        .concat(contents && contents.bundledDependencies)
        .filter(Boolean)
        .reduce(flatten, []);
    }
    else {
      return reduced.concat(include);
    }

    function flatten(reduced, value) {
      return reduced.concat(value);
    }
  }

  function testNotExcluded(excluded, candidate) {
    return (excluded.indexOf(candidate) < 0);
  }

  function directoryResolver(candidate, done) {
    /* jshint validthis:true */

    // check for match
    var requestText = candidate.request,
        regex       = options.test,
        isMatch     = !regex ||
          ((typeof regex === 'object') && (typeof regex.test === 'function') && regex.test(requestText));

    // determine whether it is a module
    var split            = isMatch && requestText.split(/[\\\/]+/),
        isRelative       = !!split && (split[0] === '.'),
        requestedPackage = isRelative && split[1],
        isDependency     = !!requestedPackage && (moduleNames.indexOf(split[1]) >= 0);

    // estimate the package that the request originates from
    var candidatePackage = isDependency && locatePackage(candidate.path);

    // ensure the candidate path is not inside the requested package
    var isAmend = !!candidatePackage && (requestedPackage !== candidatePackage);

    // amend and re-issue the request
    if (isAmend) {
      var amended = {
        path   : candidate.path,
        request: requestText.slice(2),
        query  : candidate.query,
        module : true
      };
      this.doResolve(['module'], amended, options.deprecate ? resolved : done);
    }
    // ignore
    else {
      done();
    }

    function resolved(error, result) {
      if (!error && result) {
        warn([
          'files should use ~ to refer to modules:',
          '  in directory: "' + path.relative(process.cwd(), candidate.path) + '"',
          '  change "' + amended.request + '" -> "~' + amended.request + '"'
        ].join('\n'));
      }
      done(error, result);
    }
  }
};

function locatePackage(directory) {
  var isValidDir = fs.existsSync(directory) && fs.statSync(directory).isDirectory();
  if (isValidDir) {
    var isPackage = ['bower.json', '.bower.json', 'package.json'].some(hasFile);
    if (isPackage) {
      return directory.split(/[\\\/]+/).pop();
    }
    else {
      return locatePackage(path.resolve(directory, '..'));
    }
  }

  function hasFile(filename) {
    var fullPath = path.resolve(path.join(directory, filename));
    return fs.existsSync(fullPath) && fs.statSync(fullPath).isFile();
  }
}