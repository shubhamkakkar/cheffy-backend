'use strict';

var path = require('path');

module.exports = require(path.resolve('app/inputfilters/whitelist'))([
  'name',
  'description',
  'price_min',
  'price_max',
  'quantity',
  'chef_location_radius'
], 'form-data');
