'use strict';

const sequelize = require('sequelize').Op;
const { Notification } = require('../models/index');
exports.getNotifications = async (userId, page, perPage) => {
	const notifications = await Notification.findAll({
		attributes: ['id', ['orderTitle', 'title'], ['orderBrief', 'desc'], 'timestamp'],
		where: {
			userId: userId,
			state_type: {
				[sequelize.not]: 'seen',
			},
		},
		order: [['id', 'DESC']],
		limit: parseInt(perPage),
		offset: parseInt((page - 1) * perPage),
	});
	return notifications;
};

exports.updateNotificationState = async (notificationId, state_type) => {
	let notification = await Notification.findOne({
		where: { id: notificationId },
	});
	notification.state_type = state_type;
	await notification.save();
	return notification;
};
