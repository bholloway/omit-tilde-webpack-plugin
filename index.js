'use strict';

var path = require('path');

function OmitTildeWebpackPlugin(files) {
  this.files = files;
}
module.exports = OmitTildeWebpackPlugin;

OmitTildeWebpackPlugin.prototype.apply = function apply(compiler) {
  var warn     = noop,
      depNames = [].concat(this.files)
        .reduce(eachJSON, []);

  compiler.plugin('compilation', onCompilation);

  if (depNames.length) {
    compiler.resolvers.normal.plugin('directory', directoryResolver);
  } else {
    warn('No dependencies found, plugin will not run');
  }

  function noop() {
    /* placeholder against compilation not initialised */
  }

  function onCompilation(compilation) {
    var warnings = [];
    warn = addWarning;

    function addWarning() {
      var text = ['omit-tilde-webpack-plugin'].concat(Array.prototype.slice.call(arguments))
        .join(' ');
      if (warnings.indexOf(text) < 0) {
        compilation.warnings.push(text);
        warnings.push(text);
      }
    }
  }

  function eachJSON(reduced, filename) {
    var contents;
    try {
      contents = require(path.resolve(filename));
    }
    catch (exception) {
      warn('file', filename, 'was not found in the working directory');
    }
    return reduced
      .concat(contents && Object.keys(contents.dependencies))
      .concat(contents && Object.keys(contents.devDependencies))
      .filter(Boolean)
      .reduce(flatten, []);

    function flatten(reduced, value) {
      return reduced.concat(value);
    }
  }

  function directoryResolver(candidate, done) {
    /* jshint validthis:true */
    var requestText  = candidate.request,
        isCSS        = /\.s?css$/.test(path.extname(requestText)),
        split        = isCSS && requestText.split(/[\\\/]+/),
        isRelative   = split && (split[0] === '.'),
        isDependency = split && (depNames.indexOf(split[1]) >= 0);
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