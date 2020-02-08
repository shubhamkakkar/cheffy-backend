'use strict';


const  path = require('path');
const utils = require(path.resolve('./server/utils'));
const middlewares = require(path.resolve('./server/middlewares'));


/**
Should return boolean value or bool value wrapped in promise
*/
exports.isOwner = (req, orderDelivery) => {

  if (!orderDelivery || !req.user)
    return false;
  if (orderDelivery.userId && utils.equals(req.user.id, orderDelivery.userId))
    return true;
  if (orderDelivery.user && orderDelivery.user.id && utils.equals(req.user.id, orderDelivery.user.id))
    return true;
  return false;
};

exports.isOrderDeliveryDriver = (req, orderDelivery) => {
  orderDelivery = orderDelivery || req.orderDelivery;
  console.log('driver')
  if (!orderDelivery || !req.user)
    return false;
  if (orderDelivery.driverId && utils.equals(req.user.id, orderDelivery.driverId))
    return true;
  if (orderDelivery.driver && orderDelivery.driver.id && utils.equals(req.user.id, orderDelivery.driver.id))
    return true;
  return false;
};


exports.isOwnerMiddleware = () => {
  return [
    middlewares.authorization((req) => {
      return exports.isOwner(req);
    })
  ];
};

exports.isOrderDeliveryDriverMiddleware = () => {
  return [
    middlewares.authorization((req) => {      
      return exports.isOrderDeliveryDriver(req);
    })
  ];
};

//checks if user or driver of an orderDelivery

exports.isUserOrDriverMiddleware = () => {
  return [
    middlewares.authorization((req) => {
      return exports.isOwner(req) || exports.isOrderDeliveryDriver(req);
    })
  ];
}
