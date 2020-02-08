'use strict';

var path = require('path');

module.exports = require(path.resolve('app/inputfilters/whitelist'))([
  'id',
  'auth_token',
  'device',
  'ip',
  'createdAt',
  'updatedAt'
]);
