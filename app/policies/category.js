'use strict';


const  path = require('path');
const utils = require(path.resolve('./server/utils'));
const policyHelpers = require(path.resolve('app/policies/helpers'));
const middlewares = require(path.resolve('./server/middlewares'));


/**
Should return boolean value or bool value wrapped in promise
*/
exports.isOwner = (req, category) => {
  category = category || req.category;
  if (!category || !req.user)
    return false;
  if (category.userId && utils.equals(req.user.id, category.userId))
    return true;
  if (category.user && category.user.id && utils.equals(req.user.id, category.user.id))
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
