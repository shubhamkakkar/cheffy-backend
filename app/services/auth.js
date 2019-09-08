'use strict';
const jwt = require('jsonwebtoken');

exports.generateToken = async (data) => {
  return jwt.sign(data, global.SALT_KEY, { expiresIn: '24h' });
}

exports.decodeToken = async (token) => {
    var data = await jwt.verify(token, global.SALT_KEY);
    return data;
}

exports.authorize = function (req, res, next) {
    var token = req.query.token || req.headers['x-access-token'];

    if (!token) {
        res.status(401).json({
            message: 'Acesso Restrito'
        });
    } else {
      jwt.verify(token, global.SALT_KEY, function (error, decoded) {
        if (error) {
          res.status(401).json({
            message: 'Token Invalid'
          });
        } else {
          next();
        }
      });
    }
};

exports.authorizeAdmin = function (req, res, next) {
    var token = req.query.token || req.headers['x-access-token'];

    if (!token) {
        res.status(401).json({
            message: 'Acess denny'
        });
    } else {
      jwt.verify(token, global.SALT_KEY, function (error, decoded) {
        if (error) {
          res.status(401).json({
            message: 'Token Invalid'
          });
        } else {
          if (decoded.type === 'admin'){
            next();
          } else {
            res.status(401).json({
              message: 'You ar not Admin'
            });
          }
        }
      });
    }
};
