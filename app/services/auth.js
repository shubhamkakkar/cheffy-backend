'use strict';
const jwt = require('jsonwebtoken');
const debug = require('debug')('auth-service');
const { User } = require('../models/index');

exports.generateToken = async (data) => {
  return jwt.sign(data, global.SALT_KEY, { expiresIn: '365d' });
}

exports.decodeToken = async (token) => {
    var data = await jwt.verify(token, global.SALT_KEY);
    return data;
}

exports.authorize = async (req, res, next) => {
    var token = req.query.token || req.headers['x-access-token'];

    if (!token) {
      return res.status(401).json({
          message: 'Accesso Restricto'
      });
    }

    jwt.verify(token, global.SALT_KEY, function (error, decoded) {
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

    });

    //logout feature

    const existUser =  await User.findOne({ where: { id: req.userId } });

    if(existUser.auth_token==null){

      return res.status(401).json({
          message: 'Login required!'

      })    
    }

    next();

};

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
