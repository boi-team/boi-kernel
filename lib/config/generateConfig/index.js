'use strict';

const _                       = require('lodash');
const Path                    = require('path');
const GenerateEntry           = require('./_entry.js');
const GenerateOutput          = require('./_output.js');
const GenerateModuleAndPlugin = require('./_mp.js');
const Env                     = require('../../constants').env;

/**
 * @module
 * @desc 生成webpack配置以及依赖模块
 * @param config {Object} - 用户配置项
 * @return {Object} - webpack配置以及依赖模块
 */
module.exports = (config) => {
  const ModuleAndPlugins = GenerateModuleAndPlugin(config);
  const EntryAndPlugins = GenerateEntry(config);
  const ExtraResolvePath = ((extra) => {
    let _paths = [];
    if (!extra || extra.length === 0) {
      return _paths;
    }
    extra.forEach(function (v) {
      if (v.reslovePath && _.isString(v.reslovePath)) {
        _paths.push(Path.resolve(process.cwd(), 'node_modules', v.reslovePath));
      }
    });
    return _paths;
  })(config.pluginConfig);

  // npm global模块的路径
  // 默认情况下，使用nvm管理node的环境下，global模块不能被resolve解析，参考https://github.com/creationix/nvm/pull/97
  /* eslint-disable */
  const NpmRootPath = _.trim(exec('npm root -g', {
    silent: true
  }).stdout);
  /* eslint-enable */
  // 全局安装boi的node_modules目录
  const BoiModulesPath = Path.posix.join(NpmRootPath, 'boi/node_modules');

  return {
    wp: Object.assign({
      entry: EntryAndPlugins.entry,
      output: GenerateOutput(config),
      module: ModuleAndPlugins.module,
      plugins: ModuleAndPlugins.plugins.concat(EntryAndPlugins.plugins),
      resolveLoader: {
        modules: [
          // 构建工具自身的模块目录
          Path.posix.join(__dirname, '../../../node_modules'),
          // 项目自身的模块目录
          Path.posix.join(process.cwd(), 'node_modules'),
          NpmRootPath,
          BoiModulesPath
        ].concat(ExtraResolvePath)
      },
      resolve: {
        modules: [
          Path.posix.join(__dirname, '../../../node_modules'),
          Path.posix.join(process.cwd(), 'node_modules'),
          NpmRootPath,
          BoiModulesPath
        ].concat(ExtraResolvePath)
      },
      // 开发环境使用eval-source-map提高重构建速度
      devtool: process.env.BOI_ENV === Env.development ?
        'eval-source-map' : false
    }, ModuleAndPlugins.extras),
    dependencies: ModuleAndPlugins.dependencies
  };
};
