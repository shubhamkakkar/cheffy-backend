const path = require('path');
const userConstants = require(path.resolve('app/constants/users'));

exports.isUser = (req, res, next) =>  {
	if (req.user && req.user.user_type === userConstants.USER_TYPE_USER) {
		return true;
	}
	return false
};

exports.isAdmin = (req, res, next) =>  {
	 
	if (req.user && req.user.user_type === userConstants.USER_TYPE_ADMIN) {
		return true;
	}
	return false
};

exports.isChef = (req, res, next) =>  {
	if (req.user && req.user.user_type === userConstants.USER_TYPE_CHEF) {
		return true;
	}
	return false
};

exports.isDriver = (req, res, next) =>  {
	if (req.user && req.user.user_type === userConstants.USER_TYPE_DRIVER) {
		return true;
	}
	return false
};
