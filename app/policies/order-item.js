'use strict';


const  path = require('path');
const utils = require(path.resolve('./server/utils'));
const middlewares = require(path.resolve('./server/middlewares'));


/**
Should return boolean value or bool value wrapped in promise
*/
exports.isOwner = (req, orderItem) => {

  if (!orderItem || !req.user)
    return false;
  if (orderItem.user_id && utils.equals(req.user.id, orderItem.user_id))
    return true;
  return false;

};

exports.isOrderItemChef = (req, orderItem) => {
  orderItem = orderItem || req.orderItem;

  if (!orderItem || !req.user)
    return false;
  if (orderItem.plate && orderItem.plate.userId && utils.equals(req.user.id, orderItem.orderItem.plate.userId))
    return true;
  if (orderItem.custom_plate_order && orderItem.custom_plate_order.chefID && utils.equals(req.user.id, orderItem.custom_plate_order.chefID))
    return true;
  return false;
};


exports.isOwnerMiddleware = (app) => {
  return [
    middlewares.authorization((req) => {
      return exports.isOwner(req);
    })
  ];
};

exports.isOrderItemChefMiddleware = (app) => {
  return [
    middlewares.authorization((req) => {
      return exports.isOrderItemChef(req);
    })
  ];
};
