'use strict';
const path = require('path');
const basketConstants = require(path.resolve('app/constants/baskets'));
const orderItemConstants = require(path.resolve('app/constants/order-item'));
/**
* @Model: OrderItem
* Individual Order items
*/
module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define('OrderItem', {
    orderId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Orders',
        key: 'id'
      }
    },
    /*walletId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Wallets',
        key: 'id'
      }
    },*/
    plate_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Plates',
        key: 'id'
      },
      allowNull: true,
    },
    customPlateId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'CustomPlateOrders',
        key: 'id'
      },
      allowNull: true,
    },
    state_type: {
      type: DataTypes.ENUM(
        orderItemConstants.STATE_TYPE_PENDING,
        orderItemConstants.STATE_TYPE_APPROVED,
        orderItemConstants.STATE_TYPE_REJECTED,
        orderItemConstants.STATE_TYPE_CANCELED,
      ),
      defaultValue: orderItemConstants.STATE_TYPE_PENDING
    },
    //user_id here refers to user who ordered the item
    user_id: DataTypes.INTEGER,
    state_type: {
      type: DataTypes.ENUM(orderItemConstants.STATUS_PREPARING, orderItemConstants.STATUS_COMPLETED, orderItemConstants.STATUS_WAITING, orderItemConstants.STATUS_DELIVERED),
      defaultValue: orderItemConstants.STATUS_PREPARING
    },
    chef_location: DataTypes.STRING,
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    amount: DataTypes.DOUBLE,
    quantity: DataTypes.INTEGER,
  }, {});

  OrderItem.associate = function(models) {
    OrderItem.belongsTo(models.Order, {foreignKey: 'orderId', as: 'order'})
    //OrderItem.belongsTo(models.Wallet, {foreignKey: 'walletId', as: 'wallet'})
    OrderItem.belongsTo(models.Plates, {foreignKey: 'plate_id', as: 'plate'})
    OrderItem.belongsTo(models.CustomPlateOrder, {foreignKey: 'customPlateId', as: 'custom_plate_order'})
  };
  return OrderItem;
};
