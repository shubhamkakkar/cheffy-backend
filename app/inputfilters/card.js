'use strict';

var path = require('path');

exports.stripeUpdateFilter = require(path.resolve('app/inputfilters/whitelist'))([
  //'customer',
  'name',
  'description',
  'coupon',
  'default_source',
  //'email',
  'invoice_prefix',
  'invoice_settings',
  'metadata',
  'preferred_locales',
  'shipping',
  'tax_exempt'
]);
