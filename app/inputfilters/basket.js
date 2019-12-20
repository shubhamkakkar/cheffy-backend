'use strict';

var path = require('path');

module.exports = require(path.resolve('app/inputfilters/whitelist'))([  
  'plateId',
  'quantity',
  'note'
]);
