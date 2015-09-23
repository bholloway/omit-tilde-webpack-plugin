# Omit Tilde Webpack Plugin

[![NPM](https://nodei.co/npm/omit-tilde-webpack-plugin.png)](http://github.com/bholloway/omit-tilde-webpack-plugin)

Webpack plugin that allows module imports to omit a tilde

This plugin is aware of your modules an will infer imports without a tilde.

## Ratonale

In some cases (e.g. SASS `@import` statements) Webpack requires you to indicate modules by using a tilde (`~`) prefix. Tilde is necessary to resolve an ambiguous import syntax in the given language.

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
    new OmitTildeWebpackPlugin({
      include  : ['package.json', 'bower.json', 'some-package-name'],
      exclude  : 'some-other-package-name',
      deprecate: true
  ]
}
```

Do **not** wrap with `webpack.ResolverPlugin()`, use as a separate plugin.

### Options

The `include` option is one or more modules names or project relative JSON file paths (e.g. `package.json`). A `.json` suffix indicates a file that specifies `dependencies` and/or `devDependencies`. Any other string indicates a module name.

The `exclude` option is one or more module names to remove from the include list.

The `deprecate` option implies that a warning should be generated whenever the plugin needs to operate. Use this to help migration from ommited tilde to appropriate use of tilde. It is not activiated by default but is strongly encouraged.
