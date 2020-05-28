'use strict';


const  path = require('path');
const utils = require(path.resolve('./server/utils'));
const policyHelpers = require(path.resolve('app/policies/helpers'));
const middlewares = require(path.resolve('./server/middlewares'));


/**
Should return boolean value or bool value wrapped in promise
*/
exports.isOwner = (req, plate) => {
  plate = plate || req.plate;
  if (!plate || !req.user)
    return false;
  if (plate.userId && utils.equals(req.user.id, plate.userId))
    return true;
  if (plate.chef && plate.chef.id && utils.equals(req.user.id, plate.chef.id))
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
