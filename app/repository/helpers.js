'use strict';
const path = require('path');
const appConfig = require(path.resolve('config/app'));

exports.deliveryPriceHelper = (item) => {
  if(item.distance) {
    const distance = Math.round((item.distance + Number.EPSILON) * 100)/100;
    const deliveryEstimate = Math.round(((appConfig.delivery.unitPrice * distance) + Number.EPSILON) * 100)/100;

    return {...item, distance};
  }
  return item;

};

/**
* For plates and customPlates list
* Adds delivery price estimates and rounds distance and deliveryEstimate
*/
exports.deliveryPriceHelperList = (list) => {
  return list.map(item => {
    return item.get({plain: true});
  }).map(exports.deliveryPriceHelper);
}
