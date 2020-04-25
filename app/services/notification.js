const path = require('path');
const FCM = require(path.resolve('app/services/fcm'));
const asyncHandler = require('express-async-handler');
const { Notification, sequelize } = require(path.resolve('app/models/index'));
const notificationConstants = require(path.resolve(
	'app/constants/notification'
));

exports.sendPushNotification = asyncHandler(async (data) => {
	try {
		//Notify the Cheff
		let push_notification = {
			orderTitle: data.title,
			orderBrief: data.brief,
			device_registration_tokens: data.device_registration_tokens,
		};
		await FCM(push_notification).then((response) => {
			console.log(response);
		});

		var notification = {
			userId: data.userId,
			timestamp: sequelize.literal('CURRENT_TIMESTAMP'),
			state_type: notificationConstants.NOTIFICATION_TYPE_SENT,
			orderTitle: data.title,
			orderBrief: data.brief,
			activity: data.activity,
			device_id: data.device_ids,
			order_id: data.order_id,
		};
		await Notification.create(notification);
	} catch (e) {
		console.log('Failed to send notification', e);
	}
});
