'use strict'

// node modules
let glob = require('glob');
let path = require('path');

// webpack plugins
let webpack = require('webpack');
let ExtractTextPlugin = require('extract-text-webpack-plugin');

let _ = require('lodash');
// fn
let fn_genEntry = require('./_entry.js');
let fn_genOutput = require('./_output.js');
let fn_genModuleAndPlugin = require('./_mp.js');

const ENV = require('../../constants').env;

/**
 * @param config {Object} - 用户配置项
 */
module.exports = function(config) {
    let _entry = null,
        _output = null,
        _module = null,
        _plugins = null;

    let _moduleAndPlugins = null;

    let _entryAndPlugins = fn_genEntry(config);
    _entry = _entryAndPlugins.entry;

    _output = fn_genOutput(config);

    _moduleAndPlugins = fn_genModuleAndPlugin(config);

    _module = _moduleAndPlugins.module;
    _plugins = _moduleAndPlugins.plugins.concat(_entryAndPlugins.plugins);

    let _extraResolvePath = ((extra) => {
        let _paths = [];
        if (!extra || extra.length === 0) {
            return _paths;
        }
        extra.forEach(function(v) {
            if (v.reslovePath && _.isString(v.reslovePath)) {
                _paths.push(path.resolve(process.cwd(), 'node_modules', v.reslovePath));
            }
        });
        return _paths;
    })(config.extraLoaders);

    // 配置webpack loader的寻址路径
    // 使用nvm管理node的环境下，npm install -g的模块不能被resolve解析，这是nvm作者的个人偏好
    // @see https://github.com/creationix/nvm/pull/97
    // path.resolve(__dirname, '../../../node_modules')是构建工具自身的模块目录
    // path.resolve(process.cwd())是具体项目的模块目录
    let _resolveLoader = {
        modulesDirectories: ["node_modules"],
        fallback: [
          path.resolve(__dirname,'../../../node_modules'),
          path.resolve(process.cwd(),'node_modules')
        ].concat(_extraResolvePath)
    };
    // 资源文件的寻址路径配置
    // fallback必须配置，不然一些webpack loader的插件（比如babel preset）无法获得正确资源
    let _resolve = {
        modulesDirectories: ["node_modules"],
        fallback: [
          path.resolve(__dirname,'../../../node_modules'),
          path.resolve(process.cwd(),'node_modules')
        ].concat(_extraResolvePath)
    };

    return _.assign({}, {
        wp: _.assign({
            entry: _entry,
            output: _output,
            module: _module,
            plugins: _plugins,
            resolveLoader: _resolveLoader,
            resolve: _resolve,
            devtool: process.env.BOI_ENV === ENV.development ? 'source-map' : ''
        },_moduleAndPlugins.extras),
        dependencies: _moduleAndPlugins.dependencies
    });
}
