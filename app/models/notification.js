'use strict';
const path = require('path');
const notificationConstants = require(path.resolve('app/constants/notification'));

/**
* @Model: Notification
* User Notification for items to be ordered.
*/
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    timestamp: DataTypes.DATE,
    state_type: {
      type: DataTypes.ENUM(
        notificationConstants.NOTIFICATION_TYPE_UNSENT,
        notificationConstants.NOTIFICATION_TYPE_SENT,
        notificationConstants.NOTIFICATION_TYPE_SEEN
      ),
      defaultValue: notificationConstants.NOTIFICATION_TYPE_UNSENT
    },
    orderTitle: DataTypes.STRING,
    orderBrief: DataTypes.STRING,
    activity: DataTypes.STRING,
    device_id: {
      type: DataTypes.STRING,
      references: {
        model: 'Users',
        key: 'device_id'
      }
    },
    order_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Orders',
        key: 'id'
      }
    }
  }, {});
  Notification.associate = function(models) {
    Notification.belongsTo(models.User, {foreignKey: 'userId', as: 'user', onDelete: 'cascade'})
    Notification.belongsTo(models.Order, {foreignKey: 'order_id', as: 'order'})
  };
  return Notification;
};
