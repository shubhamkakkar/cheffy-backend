'use strict';

const {Notification, sequelize} = require("../models/index");

exports.getNotifications = async (userId) => {
  // sequelize.sync({force: true});
  const notifications = await Notification.findAll({where: { userId: userId }, order: [["id", "DESC"]]});
  return notifications;
}

exports.updateNotificationState = async (notificationId, state_type) => {
  let notification = await Notification.findOne({where: { id: notificationId }});
  notification.state_type = state_type;
  await notification.save();
  return notification;
}
