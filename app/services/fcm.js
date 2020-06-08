const path = require("path");
const fcmAPI = require(path.resolve("config/fcmSettings.json")).fcm;
const FCM = require("fcm-push");
const { Notification, sequelize } = require(path.resolve("app/models/index"));

/*For Notifications*/

const saveNotification = (data) => {
  const notifications = data.detail.map((element) => {
    return {
      timestamp: sequelize.literal("CURRENT_TIMESTAMP"),
      orderTitle: data.orderTitle,
      orderBrief: data.orderBrief,
      userId: element.userId,
      device_id: element.deviceId,
    };
  });
  Notification.bulkCreate(notifications);
};

module.exports = async (data) => {
  console.log("here");
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
  try {
    const res = await fcm.send(message);
    console.log({ res });
  } catch (err) {
    console.log("Something has gone wrong!", err);
  } finally {
    saveNotification(data);
  }
};
