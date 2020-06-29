'use strict';

var path = require('path');

module.exports = require(path.resolve('app/inputfilters/whitelist'))([
  'name',
  'description',
  // "url"
], 'form-data');
