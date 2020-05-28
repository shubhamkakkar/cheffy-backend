'use strict';

var path = require('path');

module.exports = require(path.resolve('app/inputfilters/whitelist'))([
    "foodName",
    "description",
    "photo",
    "chefRange",
    "quantity",
    "allDay",
    "deliveryTime"
]);
