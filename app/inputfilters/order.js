'use strict';

var path = require('path');

exports.orderItemUpdate = require(path.resolve('app/inputfilters/whitelist'))([
  'status'
]);

exports.orderUpdate = require(path.resolve('app/inputfilters/whitelist'))([
  'state_type'
]);
