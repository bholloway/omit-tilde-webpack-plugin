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

  // Resolvers were immediately available in Webpack 1
  if (compiler.resolvers.normal) {
    applyResolver(compiler);
  }
  // In Webpack 2 we must wait until after resolvers
  else {
    compiler.plugin('after-resolvers', applyResolver);
  }

  function afterCompile(compilation, done) {
    recursionMap = {};
    compilation.warnings.push.apply(compilation.warnings, warnings);
    done();
  }

  function warn() {
    var text = [PACKAGE_NAME]
      .concat(Array.prototype.slice.call(arguments))
      .join(' ');
    if (warnings.indexOf(text) < 0) {
      warnings.push(text);
    }
  }

  function recursionStart(key) {
    if (typeof recursionMap[key] === 'number') {
      clearTimeout(recursionMap[key]);
    }
    recursionMap[key] = true;
  }

  function recursionEnd(key) {
    if (typeof recursionMap[key] === 'number') {
      clearTimeout(recursionMap[key]);
    }
    recursionMap[key] = setTimeout(function () {
      recursionMap[key] = false;
    }, 1);
  }

  function applyResolver(compiler) {

    // add additional directory resolver
    compiler.resolvers.normal.plugin('directory', directoryResolver);

    function directoryResolver(candidate, done) {
      /* jshint validthis:true */

      // compatible with these major versions of webpack
      var isWebpack1 = ('request' in candidate),
          isWebpack2 = ('relativePath' in candidate);
      if (!isWebpack1 && !isWebpack2) {
        throw new Error('Not compatible with the current version of Webpack');
      }

      // we will need to indirectly access these fields below
      var doResolve         = (isWebpack2 ? this.doResolve : doResolveOld).bind(this),
          basePathField     = isWebpack2 ? 'descriptionFileRoot' : 'path',
          relativePathField = isWebpack2 ? '__innerRequest_request' : isWebpack1 ? 'request' : null;

      // avoid recursing, request must lead with single ./ to be relevant
      var requestPath    = candidate[basePathField],
          requestedFile  = candidate[relativePathField].split('!').pop(),
          normalisedFile = path.normalize(requestedFile),
          isRelevant     = /^\.[\\\/]/.test(requestedFile) && /^[^\.~\\\/]/.test(normalisedFile),
          recursionKeys  = tail(normalisedFile).map(toRecursionKey),
          isRecursing    = recursionKeys.some(testRecursing);

      // abort early
      if (!isRelevant || isRecursing) {
        done();
      }
      // proceed unless filtered
      else {
        var isIncluded = [basePathField, relativePathField].map(eachOptionValue);

        // verbose messaging
        if (options.verbose) {
          var text = [PACKAGE_NAME + ':']
            .concat([basePathField, relativePathField].map(eachOptionMessage))
            .join('\n  ');
          console.log(text);
        }

        // repeat the request, but this time we control the callbacks
        if (isIncluded.every(Boolean)) {
          recursionStart(recursionKeys[0]);
          doResolve(['directory'], candidate, null, onDirectoryResolve);
        }
        // not relevant
        else {
          done();
        }
      }

      function tail(filepath) {
        var list = filepath.split(/([\\\/])/);
        var result = [];
        for (var i = 0; i < list.length; i += 2) {
          result.push(list.slice(i).join(''));
        }
        return result;
      }

      function toRecursionKey(file) {
        return [requestPath, file].join('|');
      }

      function testRecursing(key) {
        return !!recursionMap[key];
      }

      function doResolveOld() {
        /* jshint validthis:true */
        var args = Array.prototype.slice.call(arguments);
        var spliced = args.slice(0, 2).concat(args.slice(3)); // remove 3rd argument at index 2
        return this.doResolve.apply(this, spliced);
      }

      function eachOptionValue(field) {
        return ModuleFilenameHelpers.matchObject(options[field] || {}, candidate[field]);
      }

      function eachOptionMessage(field, i) {
        return (isIncluded[i] ? '\u2713' : '\u2715') + ' ' + field + ' "' + candidate[field] + '"';
      }

      function onDirectoryResolve(error, result) {
        recursionEnd(recursionKeys[0]);

        // relaunch the request as a module, removing any relative path prefix
        if (!result) {
          var amended = {
            path   : candidate.path,
            request: normalisedFile,
            query  : candidate.query,
            module : true
          };
          doResolve(['module'], amended, null, options.deprecate ? resolved : done);
        }
        // use the original request
        else {
          done(error, result);
        }

        function resolved(error, result) {
          if (!error && result) {
            warn([
              'files should use ~ to refer to modules:',
              '  in directory: "' + requestPath + '"',
              '  change "' + normalisedFile + '" -> "~' + normalisedFile + '"'
            ].join('\n'));
          }
          done(error, result);
        }
      }
    }
  }
};