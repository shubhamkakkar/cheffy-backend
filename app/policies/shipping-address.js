'use strict';


const  path = require('path');
const utils = require(path.resolve('./server/utils'));
const policyHelpers = require(path.resolve('app/policies/helpers'));
const middlewares = require(path.resolve('./server/middlewares'));


/**
Should return boolean value or bool value wrapped in promise
*/
exports.isOwner = (req, shippingAddress) => {
  shippingAddress = shippingAddress || req.shippingAddress;
  console.log(req.user.id, shippingAddress.userId);
  if (!shippingAddress || !req.user)
    return false;
  if (shippingAddress.userId && utils.equals(req.user.id, shippingAddress.userId)) {
    return true;
  }
  if (shippingAddress.user && shippingAddress.user.id && utils.equals(req.user.id, shippingAddress.user.id))
    return true;
  return false;

};

exports.isAdminMiddleware = (app) => {
  return [
    middlewares.authorization((req) => {
      return policyHelpers.isAdmin(req);
    })
  ];
};

exports.isCollaboratorMiddleware = (app) => {
  return [
    middlewares.authorization((req) => {
      return exports.isOwner(req) || policyHelpers.isAdmin(req);
    })
  ];
};

exports.isOwnerMiddleware = (app) => {
  return [
    middlewares.authorization((req) => {
      return exports.isOwner(req);
    })
  ];
};
