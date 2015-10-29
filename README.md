# Omit Tilde Webpack Plugin

[![NPM](https://nodei.co/npm/omit-tilde-webpack-plugin.png)](http://github.com/bholloway/omit-tilde-webpack-plugin)

Webpack plugin that allows module imports to omit a tilde.

This plugin is aware of your modules an will infer imports without a tilde.

## Rationale

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

Do **not** wrap with `webpack.ResolverPlugin()`, use as a separate plugin.

Note that the plugin cannot automatically identify modules. You will need to give it some means of determining what you will want to ommit tilde for.

### Node modules or Bower components ###

In the typical use-case you will want to be able to omit the tilde for all dependencies in your `node_modules`.

Include the `.json` file that specifies the dependencies.

```javascript
var OmitTildeWebpackPlugin = require('omit-tilde-webpack-plugin');
{
  plugins : [
    new OmitTildeWebpackPlugin({
      include  : 'package.json',
      deprecate: true
    })
  ]
}
```

### Peer projects and other dependencies ###

Lets imagine you have already setup Webpack resolve projects in a given folder. Imagine this folder contains `projectA` and `projectB` but does not contain a `package.json`-like file. You will need to explicitly include these folders as dependencies.

```javascript
var OmitTildeWebpackPlugin = require('omit-tilde-webpack-plugin');
{
  plugins : [
    new OmitTildeWebpackPlugin({
      include  : ['projectA', 'projectB'],
      deprecate: true
    })
  ]
}
```

Since the `include` arguments do not end in `.json` they simply specify modules that Webpack already knows how to resolve.

You can combine any number of `.json` files with explicit dependencies.

### Options

```javascript
new OmitTildeWebpackPlugin({
  test     : /\.someExt$/ ,
  include  : ['package.json', 'bower.json', 'some-module-name'],
  exclude  : 'some-other-package-name',
  deprecate: true
}
```

* `test` is an optional regular expression for which to restrict operation only to dependencies that match the expression. By default the plugin will operate on all types without restriction.

* `include` is one or more modules names or project relative JSON file paths (e.g. `package.json`). A `.json` suffix indicates a file that specifies `dependencies` and/or `devDependencies` and/or `bundledDependencies`. Any other string indicates a module name.

* `exclude` is any number of module names to remove from the include list.

* `deprecate` implies that a warning should be generated whenever the plugin needs to operate. Use this to help migration from ommited tilde to appropriate use of tilde. It is not activiated by default but is strongly encouraged.
