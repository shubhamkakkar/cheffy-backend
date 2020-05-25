'use strict';

const authService = require('../services/auth');
const HttpStatus = require('http-status-codes');
const asyncHandler = require('express-async-handler');
const repository = require('../repository/notification-repository');

exports.getNotifications = asyncHandler(async (req, res) => {
	const userId = req.userId || false;
	const page = req.query.page || 1;
	const perPage = req.query.perPage || 10;
	const notifications = await repository.getNotifications(
		userId,
		page,
		perPage
	);
	res.status(HttpStatus.OK).send({
		message: 'Here are your Notifications',
		data: notifications,
	});
});

exports.updateNotificationState = asyncHandler(async (req, res) => {
	if (!req.body.state_type) {
		return res.status(HttpStatus.BAD_REQUEST).send({
			message: 'Please provide notification state_type to be updated',
		});
	}
	const notification = await repository.updateNotificationState(
		req.params.notificationId,
		req.body.state_type
	);
	res.status(HttpStatus.OK).send({
		message: 'Your notification has been updated!',
		data: notification,
	});
});
