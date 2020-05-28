'use strict';
const path = require('path');
const notificationConstants = require(path.resolve('app/constants/notification'));
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Notifications', {
      id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
      },
     userId: {
      type: Sequelize.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    timestamp: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      state_type: {
      type: Sequelize.ENUM(
        notificationConstants.NOTIFICATION_TYPE_UNSENT,
        notificationConstants.NOTIFICATION_TYPE_SENT,
        notificationConstants.NOTIFICATION_TYPE_SEEN
      ),
      defaultValue: notificationConstants.NOTIFICATION_TYPE_UNSENT
    },
    orderTitle: {
        allowNull: true,
        type: Sequelize.STRING,
      },
    orderBrief: {
        allowNull: true,
        type: Sequelize.STRING,
      },
    activity: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      device_id: {
      type: Sequelize.STRING,
      /*references: {
        model: 'Users',
        key: 'device_id'
      }*/
    },
    order_id: {
      type: Sequelize.INTEGER,
      references: {
        model: 'Orders',
        key: 'id'
      }
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    }
  });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Notifications');
  }
};
