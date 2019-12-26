'use strict';

var path = require('path');

//create/update filters
exports.createFilters = require(path.resolve('app/inputfilters/whitelist'))([
  'name',
  'description',
  'price',
  'delivery_time',
  'delivery_type',
  'available',
  'categoryId',
  'ingredients',
  'chefDeliveryAvailable'
]);

//search req.query filters
exports.searchFilters = require(path.resolve('app/inputfilters/whitelist'))([
  'name',
  'price',
  'delivery_time',
  'delivery_type',
  'available',
  'chefDeliveryAvailable',
  'userId',
  'categoryId',
  'rating',
  'sort',
  'priceRange',
  'deliveryPrice',
  'dietary'
]);
