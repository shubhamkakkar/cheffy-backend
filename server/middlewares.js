'use strict';

const path = require('path');
const HttpStatus = require("http-status-codes");
const asyncHandler = require('express-async-handler');
const userConstants = require(path.resolve('app/constants/users'));

exports.authorization = (callback, passResponse) => {
	passResponse = passResponse || false;
	return asyncHandler(async (req, res, next) =>  {

		var handleBoolean = (result) => {
			if (!result) {
				return res.status(HttpStatus.FORBIDDEN).send({message: 'Forbidden'});
			}
			next();
		};

    //callback returns boolean or promise
    let result = callback(req, passResponse ? res : undefined);

		if (typeof result === 'boolean') {
			return handleBoolean(result);
		}

    if (typeof result.then === 'function') {
      const boolResult = await result;
      return handleBoolean(boolResult);
		}

    handleBoolean(false);
	});
};

const sendForbiddenResponse = (res, requiredRole) => {
	return res.status(HttpStatus.FORBIDDEN).send({message: `Forbidden. user_type: ${requiredRole} is required.`});
};

exports.roleCheck = (requiredRole) => {

	return asyncHandler(async (req, res, next) => {

		if(Array.isArray(requiredRole)) {
			if(requiredRole.indexOf(req.user.user_type) === -1) {
				return sendForbiddenResponse(res, requiredRole);
			}
			next();
		}

		if(req.user.user_type !== requiredRole) {
			return sendForbiddenResponse(res, requiredRole);
		}
		next();
	});
};

exports.chefRoleRequired = exports.roleCheck(userConstants.USER_TYPE_CHEF);
exports.userRoleRequired = exports.roleCheck(userConstants.USER_TYPE_USER);
exports.driverRoleRequired = exports.roleCheck(userConstants.USER_TYPE_DRIVER);
exports.driverOrChefRoleRequired = exports.roleCheck([userConstants.USER_TYPE_DRIVER, userConstants.USER_TYPE_CHEF]);
exports.adminRoleRequired = exports.roleCheck(userConstants.USER_TYPE_ADMIN);
