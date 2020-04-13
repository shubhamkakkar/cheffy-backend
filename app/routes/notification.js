'use strict';

const path = require('path');
const express = require('express');
const router = express.Router();
const controller = require('../controlers/notification-controller');
const authService = require(path.resolve('app/services/auth'));
const userController = require(path.resolve('app/controlers/user-controler'));

router.get(
	'/',
	authService.authorize,
	userController.getAuthUserMiddleware,
	controller.getNotifications
);

router.put(
	'/',
	authService.authorize,
	userController.getAuthUserMiddleware,
	controller.updateNotificationState
);

router.param('userId', userController.getUserByUserIdParamMiddleware);

module.exports = router;
