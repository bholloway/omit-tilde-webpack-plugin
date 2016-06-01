'use strict';

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

    // ignore recursions or exclusions
    var requestText = candidate.request,
        isRecursing = recursionMap[requestText],
        isExcluded  = !ModuleFilenameHelpers.matchObject(options, requestText);
    if (isRecursing || isExcluded) {
      done();
    }
    // repeat the request, but this time we control the callbacks
    else {
      recursionStart(requestText);
      doResolve(['directory'], candidate, onDirectoryResolve);
    }

    function onDirectoryResolve(error, result) {
      recursionEnd(requestText);
      var amended;

      // relaunch the request as a module, removing any relative path prefix
      var isRelative = /^\.[\\\/][^\.]/.test(requestText),
          isOperate  = !result && isRelative;
      if (isOperate) {
        amended = {
          path   : candidate.path,
          request: requestText.slice(2),
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