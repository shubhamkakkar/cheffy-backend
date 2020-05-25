const path = require('path');
const fcmAPI = require(path.resolve('config/fcmSettings.json')).fcm;
const FCM = require('fcm-push');
const { Notification, sequelize } = require(path.resolve('app/models/index'));

/*For Notifications*/

module.exports = async (data) => {
	const fcm = new FCM(fcmAPI.serverKey);
	const message = {
		registration_ids: data.device_registration_tokens, // Multiple tokens in an array
		notification: {
			title: data.orderTitle,
			body: data.orderBrief,
		},
	};
	try {
		const res = await fcm.send(message);
	} catch (err) {
		console.log('Something has gone wrong!', err);
	} finally {
		saveNotification(data);
	}
};

const saveNotification = (data) => {
	const notifications = data.detail.map((element) => {
		return {
			timestamp: sequelize.literal('CURRENT_TIMESTAMP'),
			orderTitle: data.orderTitle,
			orderBrief: data.orderBrief,
			userId: element.userId,
			device_id: element.deviceId,
		};
	});
	Notification.bulkCreate(notifications);
};
