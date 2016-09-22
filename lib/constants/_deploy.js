'use strict';

const DEFAULT_CONNECT_CONFIG = {
  host: '',
  port: 21,
  user: '',
  password: '',
  secure: false,
  secureOptions: null,
  connTimeout: 10000,
  pasvTimeout: 10000,
  keepalive: 10000
};

const DEFAULT_CDN_CONFIG = {
  domain: 'static.test.com',
  path: '/assets/'
};

const DEFAULT_FILES_CONFIG = {
  include: 'all',
  exclude: ['*.html']
};

module.exports = {
  connect: DEFAULT_CONNECT_CONFIG,
  cdn: DEFAULT_CDN_CONFIG,
  files: DEFAULT_FILES_CONFIG
};
