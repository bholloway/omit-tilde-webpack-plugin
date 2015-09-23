# Omit Tilde Webpack Plugin

[![NPM](https://nodei.co/npm/omit-tilde-webpack-plugin.png)](http://github.com/bholloway/omit-tilde-webpack-plugin)

Webpack plugin that allows module imports to omit a tilde

This plugin is aware of your modules an will infer imports without a tilde.

## Ratonale

In some cases (e.g. SASS `@import` statements) Webpack requires you to indicate modules by using a tilde (`~`) prefix. This is usually required because the import syntax is ambiguous in the given language.

You should use the tilde as best practice. However you may need this plugin while you migrate **legacy code** in which tilde was not used.

### Example - Bootstrap

Normally to import **Bootstrap** you might need to do something like this:

```javascript
  @import "~bootstrap-sass-official/assets/stylesheets/.../bootstrap";
```

But in your legacy code you may have this:

```javascript
  @import "bootstrap-sass-official/assets/stylesheets/.../bootstrap";
```

This plugin allows your legacy code to work out of the box, so long as `bootstrap-sass-official` is specified in your `package.json` or `bower.json`.

## Usage

```javascript
var OmitTildeWebpackPlugin = require('omit-tilde-webpack-plugin');
{
  plugins : [
    new OmitTildeWebpackPlugin(['package.json', 'bower.json'])
  ]
}
```

The single argument `files:string|Array<string>` is one or more project relative paths to `package.json`, `bower.json` or similar.

These `.json` files indicate what constitues a ***module*** (i.e. all `dependencies` and `devDependencies`).

Do **not** wrap with `webpack.ResolverPlugin()`, use as a separate plugin.
