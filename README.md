# Omit Tilde Webpack Plugin

[![NPM](https://nodei.co/npm/omit-tilde-webpack-plugin.png)](http://github.com/bholloway/omit-tilde-webpack-plugin)

Webpack plugin that allows module imports to omit a tilde.

This plugin is aware of your modules an will infer imports without a tilde.

## Rationale

In some cases (e.g. SASS `@import` statements) Webpack requires you to indicate modules by using a tilde (`~`) prefix. Tilde is necessary to resolve an ambiguous import syntax in the given language.

You should use the tilde as best practice. However you may need this plugin while you migrate **legacy code** in which tilde was not used.

**Example - Bootstrap**

Normally to import Bootstrap you might need to do something like this:

```javascript
@import "~bootstrap-sass-official/assets/stylesheets/.../bootstrap";
```

But in your legacy code you may have this:

```javascript
@import "bootstrap-sass-official/assets/stylesheets/.../bootstrap";
```

This plugin allows your legacy code to work out of the box.

## Changes in 2.x.x

> There are many varied use cased for this plugin that the author cannot anticipate.
> 
> If version 1 was working for you but version 2 breaks your use case then immediately [raise an issue](https://github.com/bholloway/omit-tilde-webpack-plugin/issues).

The new version of the plugin requires less configuration.

It automatically detects modules so you do **not** need to specify `include` or `exclude` like did previously.

There is one **breaking change** in configuration.

* If you were using `test` then you need to move it to `request.test` (see options below).

If you are unsure, use the `verbose` option to review file filtering and the `deprecate` option to display what was converted.

## Usage

Do **not** wrap with `webpack.ResolverPlugin()`, use as a separate plugin.

In most cases you may use without specifying options. However the author strongly suggests you set `deprecate:true`.

```javascript
var OmitTildeWebpackPlugin = require('omit-tilde-webpack-plugin');
{
  plugins : [
    new OmitTildeWebpackPlugin({
      deprecate: true
    })
  ]
}
```

If there are **false positive** warnings it is usually some problem with your webpack `resolve` configuration. If not, there are **options** that allow filtering.

### Options

```javascript
new OmitTildeWebpackPlugin({
  deprecate: true|false,
  verbose  : true|false,
  path     : { test: ..., include: ..., exclude: ... },
  request  : { test: ..., include: ..., exclude: ... }
}
```

* `deprecate` implies that a warning should be generated whenever the plugin needs to operate.

  Use this to help migration from ommited tilde to appropriate use of tilde. It is not activiated by default but is **strongly encouraged**.

* `path` is an optional object of conditions, similar to that for [loaders](https://webpack.github.io/docs/configuration.html#module-loaders).

  It filters the path in which the request is raised. It may inclued `test`, `include`, and `exclude` as (typically) regular expressions.

* `verbose` implies that filtering information should be displayed.

  Set to `true` when debugging `path` or `request` conditions.

* `request` is an optional object of conditions, similar to that for [loaders](https://webpack.github.io/docs/configuration.html#module-loaders).

  It filters the request itself. It may inclued `test`, `include`, and `exclude` as (typically) regular expressions.