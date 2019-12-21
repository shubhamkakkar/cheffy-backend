'use strict';

var path = require('path');
const whitelist = require(path.resolve('app/inputfilters/whitelist'));

exports.updateFields = require(path.resolve('app/inputfilters/whitelist'))(
[
  'name',
  'email',
  'country_code',
  'phone_no',
  'restaurant_name',
  'location_lat',
  'location_lon',
], 'form-data');

exports.locationFields = require(path.resolve('app/inputfilters/whitelist'))(
[
  'location_lat',
  'location_lon'
]);
