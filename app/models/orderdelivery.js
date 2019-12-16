'use strict';
const path = require('path');
const orderDeliveryConstants = require(path.resolve('app/constants/order-delivery'));

/**
* @Model: OrderDelivery
* Created for handling of order delivery by a driver
*/
module.exports = (sequelize, DataTypes) => {
  const OrderDelivery = sequelize.define('OrderDelivery', {
    orderId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Orders',
        key: 'id'
      }
    },
    rating: DataTypes.INTEGER,
    driverId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    pickup_time: DataTypes.DATE,
    dropoff_time: DataTypes.DATE,
    state_type: {
      type: DataTypes.ENUM(
        orderDeliveryConstants.STATE_TYPE_PENDING,
        orderDeliveryConstants.STATE_TYPE_APPROVED,
        orderDeliveryConstants.STATE_TYPE_REJECTED,
        orderDeliveryConstants.STATE_TYPE_CANCELED,
        orderDeliveryConstants.STATE_TYPE_DELIVERED,
        orderDeliveryConstants.STATE_TYPE_PICKED_UP,
        orderDeliveryConstants.STATE_TYPE_DRIVER_NOT_FOUND,
      ),
      defaultValue: orderDeliveryConstants.STATE_TYPE_PENDING
    }
  }, {});
  OrderDelivery.associate = function(models) {
    OrderDelivery.belongsTo(models.Order, {foreignKey: 'orderId', as: 'order'});
    OrderDelivery.belongsTo(models.User, {foreignKey: 'driverId'});
  };
  OrderDelivery.sync();
  return OrderDelivery;
};
