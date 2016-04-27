'use strict'

// node modules
let glob = require('glob');
let path = require('path');

// webpack plugins
let webpack = require('webpack');
let ExtractTextPlugin = require('extract-text-webpack-plugin');

// fn
let fn_genEntry = require('./fn/fn.genEntry.js');
let fn_genOutput = require('./fn/fn.genOutput.js');
let fn_genModuleAndPlugin = require('./fn/fn.genMP');

/**
 * @param config {Object} - 用户配置项
 */
module.exports = function(config) {
    let _entry = null,
        _output = null,
        _module = null,
        _plugins = null;

    let _moduleAndPlugins = null;

    _entry = fn_genEntry(config);
    _output = fn_genOutput(config);

    _moduleAndPlugins = fn_genModuleAndPlugin(config);

    _module = _moduleAndPlugins.module;
    _plugins = _moduleAndPlugins.plugins;

    // 配置webpack loader的寻址路径
    // path.resolve(__dirname, '../../../node_modules')是构建工具自身的模块目录
    // path.resolve(process.cwd())是具体项目的模块目录
    let _resolveLoader = {
        root: [
            path.resolve(__dirname, '../../../node_modules'),
            path.resolve(process.cwd())
        ],
        modulesDirectories: ["node_modules"],
        fallback: [
            path.resolve(__dirname, '../../../node_modules')
        ]
    };
    let _resolve = {
        root: [
            path.resolve(__dirname, '../../../node_modules'),
            path.resolve(process.cwd())
        ],
        fallback: [
            path.resolve(__dirname, '../../../node_modules')
        ]
    };

    return Object.assign({}, {
        entry: _entry,
        output: _output,
        module: _module,
        plugins: _plugins,
        resolveLoader: _resolveLoader,
        resolve: _resolve
    });
}