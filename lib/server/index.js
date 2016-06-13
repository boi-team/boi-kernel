'use strict'

require('babel-polyfill');

const Koa = require('koa');
const serve = require('koa-static');
const mount = require('koa-mount');
const DEFAULT_CONFIG = require('../constants/server.js').DEFAULT_CONFIG;

let path = require('path');
let colors = require('colors/safe');
let webpack = require("webpack");
let devMiddleware = require('koa-webpack-middleware').devMiddleware;
let hotMiddleware = require('koa-webpack-middleware').hotMiddleware;

let api_config = require('../api/config');

let server = module.exports = {};
let configuration = DEFAULT_CONFIG;
let app = new Koa();

server.config = function(config) {
    if (!config) {
        console.log(colors.red('Invalid configuration'));
        return;
    }
    configuration = Object.assign({},configuration,config);
}

server.run = function() {
    let webpackConfig = api_config.webpackConfig;
    let boiConfig = api_config.api.getBoiConfig();

    if (!webpackConfig) {
        webpackConfig = api_config.api.genDevConfig();
    }

    let compiler = webpack(webpackConfig);
    let _devMiddleware = devMiddleware(compiler, {
        publicPath: webpackConfig.output.publicPath,
        stats: {
            colors: true,
            chunks: false
        }
    });
    let _hotMiddleware = hotMiddleware(compiler, {});

    // 第三方依赖文件的目录映射
    // @important 务必保证mount middleware的引入顺序在devMiddleware和hotMiddleware之前，否则会失效
    if (boiConfig.basic.localPath.thirdparty) {
        app.use(mount('/libs', serve(path.resolve(process.cwd(), boiConfig.basic.localPath.thirdparty))));
    }

    app.use(_devMiddleware);
    app.use(_hotMiddleware);

    app.listen(configuration.port, function() {
        console.log(colors.blue('Server is listening ' + configuration.domain + ':port ' + configuration.port));
    });
};
