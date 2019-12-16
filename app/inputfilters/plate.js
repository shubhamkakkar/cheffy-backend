'use strict';

var path = require('path');

module.exports = require(path.resolve('app/inputfilters/whitelist'))([
  'name',
  'description',
  'price',
  'delivery_time',
  'delivery_type'
]);
