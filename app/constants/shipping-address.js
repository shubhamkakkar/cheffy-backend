'use strict';

exports.DEFAULT_RADIUS = 10;
exports.HAVERSINE_MILES_MULTIPLIER = 3959;
exports.HAVERSINE_KM_MULTIPLIER = 6371;

exports.radiusDistanceUnitHaversineMap = {
  miles: exports.HAVERSINE_MILES_MULTIPLIER,
  km: exports.HAVERSINE_KM_MULTIPLIER
};

exports.DISTANCE_MILES = 'miles';
exports.DISTANCE_KM = 'km';
