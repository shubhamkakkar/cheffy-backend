const path = require("path");
const fcmAPI = require(path.resolve("config/fcmSettings.json")).fcm;
const FCM = require("fcm-push");
const { Notification, sequelize } = require(path.resolve("app/models/index"));

/*For Notifications*/
const saveNotification = async (data) => {
  const notifications = data.detail.map((element) => {
    let commonNotifactionObj = {
      timestamp: sequelize.literal("CURRENT_TIMESTAMP"),
      orderTitle: data.orderTitle,
      orderBrief: data.orderBrief,
      userId: element.userId,
      device_id: element.deviceId,
    };

    if (data.orderId) {
      commonNotifactionObj = {
        ...commonNotifactionObj,
        order_id: data.orderId,
      };
    }
    return commonNotifactionObj;
  });
  try {
    await Notification.bulkCreate(notifications);
  } catch (err) {
    console.log("Something has gone wrong in saveNotification!", err);
  }
};

module.exports = async (data) => {
  const fcm = new FCM(fcmAPI.serverKey);
  const message = {
    registration_ids: data.device_registration_tokens, // Multiple tokens in an array
    notification: {
      title: data.orderTitle,
      body: data.orderBrief,
      // "android_channel_id": "500", android > 8.0 requirement
    },
    priority: "high", // android < 8.0 requirement
    content_available: true, // ios requirement
  };
  saveNotification(data);
  fcm
    .send(message)
    .then((res) => {
      console.log({ res });
    })
    .catch((err) => {
      console.log("Something has gone wrong!", err);
    });
};
