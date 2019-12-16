'use strict';

var path = require('path');
const whitelist = require(path.resolve('app/inputfilters/whitelist'));

module.exports = require(path.resolve('app/inputfilters/whitelist'))(
[
  'name',
  'email',
  'country_code',
  'phone_no',
  'restaurant_name',
  'location'
  //'imgPath'
], 'form-data');
