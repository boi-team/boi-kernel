'use strict';

const _ = require('lodash');
const Log = require('../utils').log;
const Express = require('express');

const Router = Express.Router();
let server = null;

// 合法的http请求method
const REG_VALID_METHOD = /^(get|post)\s+/i;
// 合法的路由pattern
const REG_VALID_PATTERN = /^(get|post)\s+\/([\w\d\/]*(\?\$[\w\d]+(\&\$[\w\d]+)*)*)*[\w\d\/]$/i;
// 匹配url参数正则
const REG_URL_PARAMTERS = /\?\$[\w\d]+(\&\$[\w\d]+)*[\w\d]+$/i;
// url query条目正则
const REG_URL_QUERY_ITEM = /\$[\w\d]+/g;

function resolve(options) {
  for (let key in options) {
    excute(key, options[key]);
  }
  server.use(Router);
}

function excute(pattern, response) {
  if (!REG_VALID_PATTERN.test(pattern)) {
    Log.error('Mock: invalid routes config');
    process.exit();
  }
  // 滤出请求方法类型
  let method = _.lowerCase(_.trim(REG_VALID_METHOD.exec(pattern)[0]));
  // 滤出url规则
  let urlPattern = _.trim(_.last(pattern.split(REG_VALID_METHOD)));

  let api = '';
  let queries = [];

  if (REG_URL_PARAMTERS.test(urlPattern)) {
    api = urlPattern.replace(REG_URL_PARAMTERS, '');
    let _item = REG_URL_QUERY_ITEM.exec(urlPattern);
    while (_item) {
      queries.push(_item[0].replace('$', ''));
      _item = REG_URL_QUERY_ITEM.exec(urlPattern);
    }
  } else {
    api = urlPattern;
  }

  route({
    method,
    api,
    queries,
    response
  });
}

function route(options) {
  let method = options.method;
  let api = options.api;
  let queries = options.queries;
  let response = options.response;

  switch (method) {
    case 'get':
      route_get(api, queries, response);
      break;
    case 'post':
      route_post(api, queries, response);
      break;
    default:
      break;
  }
}

function route_get(api, queries, response) {
  let res_ok = response.ok || {
    code: 100,
    msg: '请求成功'
  };
  let res_fail = response.fail || {
    code: 200,
    msg: '请求失败'
  };

  Router.get(api, (req, res) => {
    let ok = true;
    if(req.query.cb){
      server.set('jsonp callback name', 'cb');
    }
    // 校验query是否完整
    queries && queries.length !== 0 && (() => {
      for (let i = 0, len = queries.length; i < len; i++) {
        if (!req.query[queries[i]]) {
          ok = false;
          res_fail.msg = '参数不完整';
          return;
        }
      }
    })();
    if (ok) {
      req.query.callback||req.query.cb ? res.jsonp(res_ok) : res.json(res_ok);
    } else {
      req.query.callback||req.query.cb ? res.jsonp(res_fail) : res.json(res_fail);
    }
  });
}

function route_post(api, queries, response) {
  let res_ok = response.ok || {
    code: 100,
    msg: '请求成功'
  };
  let res_fail = response.fail || {
    code: 200,
    msg: '请求失败'
  };

  Router.post(api, (req, res) => {
    let ok = true;
    if(req.query.cb){
      server.set('jsonp callback name', 'cb');
    }
    // 校验query是否完整
    queries && queries.length !== 0 && (() => {
      for (let i = 0, len = queries.length; i < len; i++) {
        if (!req.query[queries[i]]) {
          ok = false;
          res_fail.msg = '参数不完整';
          return;
        }
      }
    })();
    if (ok) {
      !!(req.query.callback||req.query.cb) && res.jsonp(res_ok) || res.json(res_ok);
    } else {
      !!(req.query.callback||req.query.cb) && res.jsonp(res_fail) || res.json(res_fail);
    }
  });
}

module.exports = function (app) {
  server = app;
  return function (options) {
    if (!options || !_.isPlainObject(options)) {
      Log.error('Mock: invalid parameters');
      process.exit();
    }
    resolve(options);
  };
};
