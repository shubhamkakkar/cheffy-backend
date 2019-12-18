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
  if (orderItem.user && orderItem.user.id && utils.equals(req.user.id, orderItem.user.id))
    return true;
  return false;

};

exports.isOrderItemChef = (req, orderItem) => {
  orderItem = orderItem || req.orderItem;

  if (!orderItem || !req.user)
    return false;
  if (orderItem.chef_id && utils.equals(req.user.id, orderItem.chef_id))
    return true;
  if (orderItem.chef && orderItem.chef.id && utils.equals(req.user.id, orderItem.chef.id))
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

exports.isOrderItemChefMiddleware = () => {
  return [
    middlewares.authorization((req) => {
      return exports.isOrderItemChef(req);
    })
  ];
};

//checks if user or chef of an order
exports.orderItemViewPolicyMiddleware = () => {
  return [
    middlewares.authorization((req) => {      
      return exports.isOwner(req) || exports.isOrderItemChef(req);
    })
  ];
}
