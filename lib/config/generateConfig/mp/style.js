'use strict'

let _                 = require('lodash');
let path              = require('path');
let webpack           = require('webpack');
let utils             = require('../../../utils');
let ExtractTextPlugin = require('extract-text-webpack-plugin');

const ENV = require('../../../constants').env;
// 各类型文件对应的dependencies
const EXT_DEPS_MAP = {
  css: ['css-loader'],
  less: ['css-loader', 'less-loader', 'postcss-less'],
  scss: ['css-loader', 'sass-loader', 'node-sass', 'postcss-scss'],
  sass: ['css-loader', 'sass-loader', 'node-sass', 'postcss-scss'],
  stylus: ['css-loader', 'stylus-loader'],
  styl: ['css-loader', 'stylus-loader']
}

module.exports = function (config) {
  let loaders = [];
  let preLoaders = [];
  let postLoaders = [];
  let plugins = [];
  let extras = null;
  let dependencies = [];

  const CONFIG_STYLE = config.style;

  // 如果用户配置了webpack loaders，则沿袭用户的配置
  CONFIG_STYLE.webpackConfig && ((options) => {
    // check preLoader & preLoaders
    options.preLoader && _.isPlainObject(options.preLoader) && preLoaders.push(Object.assign({},
      CONFIG_STYLE.webpackConfig.preLoader));
    options.preLoaders && _.isArray(options.preLoaders) && (preLoaders = preLoaders.concat(
      options.preLoaders));
    // check loader & loaders
    options.loader && _.isPlainObject(options.loader) && loaders.push(Object.assign({},
      CONFIG_STYLE.webpackConfig.loader));
    options.loaders && _.isArray(options.loaders) && (preLoaders = loaders.concat(options.loaders));
    // check postloader & postloaders
    options.postloader && _.isPlainObject(options.postloader) && postLoaders.push(Object.assign({},
      CONFIG_STYLE.webpackConfig.postloader));
    options.postloaders && _.isArray(options.postloaders) && (postLoaders = postLoaders.concat(
      options.postloaders));
    // check plugins
    options.plugins && (plugins = plugins.concat(options.plugins));
    // check extras
    extras = utils.mapWpExtras(options);
  })(CONFIG_STYLE.webpackConfig);

  (() => {

    const EXT = CONFIG_STYLE.ext || 'css';

    const REG_EXT = new RegExp('\\.' + EXT + '$');

    // @important 必须使用contenthash，不能用hash或chunkhash
    const FILENAME = process.env.BOI_ENV !== ENV.development && CONFIG_STYLE.useHash ?
      '[name].[contenthash:8].css' :
      '[name].css';

    let extractCSS = new ExtractTextPlugin(path.posix.join(CONFIG_STYLE.output, FILENAME), {
      allChunks: true
    });

    loaders.length === 0 && (() => {
      // 图片可能被部署到独立的cdn
      // ExtractTextPlugin中publicPath配置的作用是替换style文件中引用图片的根目录
      let _imageCdn = null;
      let _boiCdn = global.boi_deploy_cdn;
      if (process.env.BOI_ENV !== ENV.development) {
        let _cdn = _boiCdn && (_boiCdn.image && _boiCdn.image.domain ? _boiCdn.image :
          _boiCdn.default);
        _cdn && (_imageCdn = _cdn.domain && (_cdn.domain.replace(/^(http(s)?\:)?\/*/,
          '\/\/') + path.posix.join('/', _cdn.path || '')) || path.posix.join('/', _cdn
          .path || ''));
      }

      function generateLoaders(loaders) {
        if (_imageCdn) {
          return extractCSS.extract(loaders.join('!'), {
            publicPath: _imageCdn
          });
        } else {
          return extractCSS.extract(loaders.join('!'), {
            publicPath: '/'
          });
        }
      }

      let _loaders = ((autoprefix, sprites) => {
        let baseLoaders = [];
        autoprefix ? baseLoaders.push('css') : baseLoaders.push('css?-autoprefixer');
        if (sprites) {
          if (!sprites.source) {
            utils.log.error('Invalid css sprites configuration!');
            process.exit(1);
          }
          baseLoaders.push('postcss');

          let sourceDirname = path.basename(sprites.source);
          // 合法的散列图路径
          const REG_SPRITES_NAME = new RegExp(path.sep + sourceDirname + path.sep);
          // 合法的retina标识
          const REG_SPRITES_RETINA = new RegExp([
            '@(\\d+)x\\.',
            _.isArray(config.image.ext) ? '(' + config.image.ext.join('|') +
            ')' : config.image.ext,
          ].join(''), 'i');
          /**
           * postcss-sprites默认配置项
           * @type {Object}
           * @see https://github.com/2createStudio/postcss-sprites
           */
          let postcssSpritesOpts = {
            retina: sprites.retina || false,
            spritePath: './.tmp_sprites',
            stylesheetPath: path.posix.join(config.basic.output, CONFIG_STYLE
              .output),
            groupBy: (image) => {
              let groups = null;
              let groupName = undefined;

              if (sprites.split) {
                groupName = path.basename(path.dirname(image.url));
              } else {
                groupName = sourceDirname;
              }
              if (sprites.retina) {
                image.retina = true;
                image.ratio = 1;
                let ratio = REG_SPRITES_RETINA.exec(image.url);
                if (ratio) {
                  ratio = ratio[1];
                  while (ratio > 10) {
                    ratio = ratio / 10;
                  }
                  image.ratio = ratio;
                  image.groups = image.groups.filter((group) => {
                    return ('@' + ratio + 'x') !== group;
                  });
                  groupName += '@' + ratio + 'x';
                }
              }
              return Promise.resolve(groupName);
            },
            filterBy: (image) => {
              if (!REG_SPRITES_NAME.test(image.url)) {
                return Promise.reject();
              }
              return Promise.resolve();
            },
            hooks: {
              onUpdateRule: (rule, token, image) => {
                require('postcss-sprites/lib/core').updateRule(rule, token, image);
                // 注入background-position
                ['width', 'height'].forEach(function (prop) {
                  rule.insertAfter(rule.last, require('postcss').decl({
                    prop: prop,
                    value: image.coords[prop] + 'px'
                  }));
                });
              }
            }
          };
          if (sprites.postcssSpritesOpts) {
            postcssSpritesOpts = Object.assign({}, postcssSpritesOpts, sprites.postcssSpritesOpts);
          }
          extras = Object.assign({}, extras, {
            postcss: function () {
              return [
                require('postcss-sprites')(postcssSpritesOpts)
              ];
            }
          });
        }

        return {
          css: generateLoaders(baseLoaders),
          less: generateLoaders(baseLoaders.concat(['less'])),
          sass: generateLoaders(baseLoaders.concat(['sass?indentedSyntax'])),
          scss: generateLoaders(baseLoaders.concat(['sass'])),
          stylus: generateLoaders(baseLoaders.concat(['stylus'])),
          styl: generateLoaders(baseLoaders.concat(['stylus'])),
        }
      })(CONFIG_STYLE.autoprefix, CONFIG_STYLE.sprites);

      loaders.push({
        test: REG_EXT,
        loader: _loaders[EXT]
      });

      plugins.push(extractCSS);

      // 收集依赖模块
      dependencies = dependencies.concat(((type) => {
        let _deps = [];
        let loaders = EXT_DEPS_MAP[type];
        let _reg = /\?/;
        _deps = loaders.filter(function (loader) {
          if (_reg.test(loader)) {
            loader = loader.split(_reg)[0];
          }
          return loader !== 'css-loader';
        });
        return _deps;
      })(EXT));
    })();
  })();

  return {
    preLoaders,
    postLoaders,
    loaders,
    plugins,
    extras,
    dependencies
  };
};
