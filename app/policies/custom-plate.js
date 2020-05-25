'use strict';


const  path = require('path');
const utils = require(path.resolve('./server/utils'));
const policyHelpers = require(path.resolve('app/policies/helpers'));
const middlewares = require(path.resolve('./server/middlewares'));


/**
Should return boolean value or bool value wrapped in promise
*/
exports.isOwner = (req, customPlate) => {
  customPlate = customPlate || req.customPlate;
  if (!customPlate || !req.user)
    return false;
  if (customPlate.userId && utils.equals(req.user.id, customPlate.userId))
    return true;
  if (customPlate.user && customPlate.user.id && utils.equals(req.user.id, customPlate.user.id))
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
