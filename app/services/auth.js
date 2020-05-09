'use strict';
const jwt = require('jsonwebtoken');
const debug = require('debug')('auth-service');
const { User } = require('../models/index');
const asyncHandler = require('express-async-handler');

exports.generateToken = async (data) => {
  return jwt.sign(data, global.SALT_KEY, { expiresIn: '365d' });
}

exports.decodeToken = async (token) => {
    var data = await jwt.verify(token, global.SALT_KEY);
    return data;
}


/**
* Sends 401 response when no token found
*/
exports.checkTokenExists = asyncHandler(async(req, res, next) => {

  let token = req.query.token || req.headers['x-access-token'];

  if (!token) {
    return res.status(401).json({
        message: 'Accesso Restricto'
    });
  }
  req.accessToken = token;

  debug('checkTokenExists', req.accessToken);

  next();
});


/**
* Just sets accessToken in req if found
* use this if optional auth token is sent in request for some apis
*/
exports.checkTokenExistsOptional = asyncHandler(async (req, res, next) => {

  let token = req.query.token || req.headers['x-access-token'];
  debug('checkTokenExistsOptional: token', token);
  if (!token) {
    return next();
  }

  req.accessToken = token;
  next();
});

/**
if no req.accessToken exists it should call next middleware
*/
exports.verifyAccessToken = asyncHandler(async(req, res, next) => {
  let token = req.accessToken;
  if(!token) return next();

  jwt.verify(token, global.SALT_KEY, function (error, decoded) {
    debug('accessToken', token);
    debug('verifyAccessToken', decoded);

    if (error) {
      return res.status(401).json({
        message: 'Token Invalid'
      });
    }

    if(!decoded.id) {
      return res.status(401).json({
        message: 'No id(userId) set in when generating token.'
      });
    }
    //use this req.userId in getAuthUserMiddleware
    req.userId = decoded.id;
    next();

  });
});

//called after authorize middleware
exports.checkUserLoggedOut = asyncHandler(async(req, res, next) => {
  if(!req.userId) return next();

  //check if user with id exists and auth_token is present in database
  User.findOne({ where: { id: req.userId }, attributes: ['auth_token'] }).then((existUser) => {

    if(!existUser) {
      return res.status(401).json({
          message: 'No user found with this token'
      });
    }

    if(existUser.auth_token === null){
      return res.status(401).json({
          message: 'User already logged out. Login required!'
      });
    }

    next();
  });

});

/**
* Authentication Middlewares
* Sends 401 response if any error or no token is set in request
*/
exports.authorize = [
  exports.checkTokenExists,
  exports.verifyAccessToken,
  exports.checkUserLoggedOut
];

/**
* Optional authentication middlewares
* Doesn't send 401 response if no token is set in request
* However if the token is invalid it sends 401 response
*/
exports.authorizeOptional = [
  exports.checkTokenExistsOptional,
  exports.verifyAccessToken,
  exports.checkUserLoggedOut
];

exports.authorizeAdmin = function (req, res, next) {
    var token = req.query.token || req.headers['x-access-token'];

    if (!token) {
        return res.status(401).json({
            message: 'Acess denny'
        });
    }

    jwt.verify(token, global.SALT_KEY, function (error, decoded) {

      if (error) {
        return res.status(401).json({
          message: 'Token Invalid'
        });
      }

      if (decoded.type !== 'admin'){
        return res.status(401).json({
          message: 'You ar not Admin'
        });
      }

      //use this req.userId in getAuthUserMiddleware
      req.userId = decoded.id;
      next();

    });

};
