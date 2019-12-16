'use strict';


const  path = require('path');
const utils = require(path.resolve('./server/utils'));
const middlewares = require(path.resolve('./server/middlewares'));
const policyHelpers = require(path.resolve('app/policies/helpers'));

/**
Should return boolean value or bool value wrapped in promise
*/
exports.isOwner = (req, document) => {
  document = document || req.document;

  if (!document || !req.user)
    return false;
  if (document.user && utils.equals(req.user.id, document.document))
    return true;
  if (document.userId && utils.equals(req.user.id, document.userId))
    return true;

  return false;
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
