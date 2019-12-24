'use strict';

var path = require('path');

module.exports = require(path.resolve('app/inputfilters/whitelist'))([
  'addressLine1',
  'addressLine2',
  'city',
  'state',
  'zipCode',
  'lat',
  'lon',
  'deliveryNote',
  'isDefaultAddress'
]);
