'use strict';

exports.round2DecimalPlaces = (num) => Math.round((num + Number.EPSILON) * 100) / 100;
