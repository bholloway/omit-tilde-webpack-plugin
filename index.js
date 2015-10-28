'use strict';

var path = require('path');

function OmitTildeWebpackPlugin(options) {
  this.options = (typeof options === 'object') ? options : {};
}
module.exports = OmitTildeWebpackPlugin;

OmitTildeWebpackPlugin.prototype.apply = function apply(compiler) {
  var options = this.options,
      warn    = noop;

  // work out the modules that we need to respond to
  var excludeNames = [].concat(options.exclude)
        .map(String),
      includeNames = [].concat(options.include)
        .map(String)
        .reduce(eachInclude, []),
      moduleNames  = includeNames
        .filter(testNotExcluded.bind(null, excludeNames));

  // hook the compiler so we can push warnings in the warn() method
  compiler.plugin('compilation', onCompilation);

  if (moduleNames.length) {
    compiler.resolvers.normal.plugin('directory', directoryResolver);
  } else {
    warn('No dependencies found, plugin will not run');
  }

  function noop() {
    /* placeholder against compilation not initialised */
  }

  function onCompilation(compilation) {
    var warnings = [];

    warn = function warn() {
      var text = ['omit-tilde-webpack-plugin'].concat(Array.prototype.slice.call(arguments))
        .join(' ');
      if (warnings.indexOf(text) < 0) {
        compilation.warnings.push(text);
        warnings.push(text);
      }
    };
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
        .concat(contents && contents.bundledDependencies && contents.bundledDependencies || [])
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
    var requestText  = candidate.request,
        isCSS        = /\.s?css$/.test(path.extname(requestText)),
        split        = isCSS && requestText.split(/[\\\/]+/),
        isRelative   = split && (split[0] === '.'),
        isDependency = split && (moduleNames.indexOf(split[1]) >= 0);
    if (isRelative && isDependency) {
      var amended = {
        path   : candidate.path,
        request: requestText.slice(2),
        query  : candidate.query,
        module : true
      };
      this.doResolve(['module'], amended, options.deprecate ? resolved : done);
    }
    else {
      done();
    }

    function resolved(error, result) {
      if (!error && result) {
        warn('(s)css files should use ~ to refer to modules:\n  change "' + amended.request + '" -> "~' +
          amended.request + '"');
      }
      done(error, result);
    }
  }
};