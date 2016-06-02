'use strict';

var path = require('path');

var ModuleFilenameHelpers = require('webpack/lib/ModuleFilenameHelpers');

var PACKAGE_NAME = require('./package.json').name;

function OmitTildeWebpackPlugin(options) {
  this.options = (typeof options === 'object') ? options : {};
}
module.exports = OmitTildeWebpackPlugin;

OmitTildeWebpackPlugin.prototype.apply = function apply(compiler) {
  var options      = this.options,
      warnings     = [],
      recursionMap = {};

  // hook the compiler so we can push warnings in the warn() method
  compiler.plugin('after-compile', afterCompile);

  // add additional directory resolver
  compiler.resolvers.normal.plugin('directory', directoryResolver);

  function warn() {
    var text = [PACKAGE_NAME]
      .concat(Array.prototype.slice.call(arguments))
      .join(' ');
    if (warnings.indexOf(text) < 0) {
      warnings.push(text);
    }
  }

  function afterCompile(compilation, done) {
    recursionMap = {};
    compilation.warnings.push.apply(compilation.warnings, warnings);
    done();
  }

  function directoryResolver(candidate, done) {
    /* jshint validthis:true */
    var doResolve = this.doResolve.bind(this);

    // void recursing, request must lead with single ./ to be relevant
    var requestFile    = candidate.request.split('!').pop(),
        normalisedFile = path.normalize(requestFile),
        isRelevant     = /^\.[\\\/]/.test(requestFile) && /^[^\.~\\\/]/.test(normalisedFile),
        recursionKey   = [candidate.path, normalisedFile].join('|'),
        isRecursing    = recursionMap[recursionKey];

    // abort early
    if (!isRelevant || isRecursing) {
      done();
    }
    // proceed unless filtered
    else {
      var isIncluded = [
        ModuleFilenameHelpers.matchObject(options.path || {}, candidate.path),
        ModuleFilenameHelpers.matchObject(options.request || {}, candidate.request)
      ];

      // verbose messaging
      if (options.verbose) {
        var text = [
          PACKAGE_NAME + ':',
          (isIncluded[0] ? '\u2713' : '\u2715') + ' path    "' + candidate.path + '"',
          (isIncluded[1] ? '\u2713' : '\u2715') + ' request "' + candidate.request + '"'
        ].join('\n  ');
        console.log(text);
      }

      // repeat the request, but this time we control the callbacks
      if (isIncluded.every(Boolean)) {
        recursionStart(recursionKey);
        doResolve(['directory'], candidate, onDirectoryResolve);
      }
      // not relevant
      else {
        done();
      }
    }

    function onDirectoryResolve(error, result) {
      recursionEnd(recursionKey);
      var amended;

      // relaunch the request as a module, removing any relative path prefix
      if (!result) {
        amended = {
          path   : candidate.path,
          request: normalisedFile,
          query  : candidate.query,
          module : true
        };
        doResolve(['module'], amended, options.deprecate ? resolved : done);
      }
      // use the original request
      else {
        done(error, result);
      }

      function resolved(error, result) {
        if (!error && result) {
          warn([
            'files should use ~ to refer to modules:',
            '  in directory: "' + candidate.path + '"',
            '  change "' + amended.request + '" -> "~' + amended.request + '"'
          ].join('\n'));
        }
        done(error, result);
      }
    }
  }

  function recursionStart(key) {
    recursionMap[key] = true;
  }

  function recursionEnd(key) {
    recursionMap[key] = false;
  }
};