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
    //order item note like extra napkins
    note: {
      type: DataTypes.STRING,
      allowNull: true
    },
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
    item_type: {
      type: DataTypes.ENUM(
        basketConstants.BASKET_TYPE_PLATE,
        basketConstants.BASKET_TYPE_CUSTOM_PLATE
      ),
    },
    deliveryType: {
      type: DataTypes.ENUM(
        orderItemConstants.DELIVERY_TYPE_CHEF,
        orderItemConstants.DELIVERY_TYPE_DRIVER,
        orderItemConstants.DELIVERY_TYPE_USER
      ),
      defaultValue: orderItemConstants.DELIVERY_TYPE_USER
    },
    state_type: {
      type: DataTypes.ENUM(
        orderItemConstants.STATE_TYPE_PENDING,
        orderItemConstants.STATE_TYPE_APPROVED,
        orderItemConstants.STATE_TYPE_REJECTED,
        orderItemConstants.STATE_TYPE_CANCELED,
        //when chef finishes preparing the ordered item
        orderItemConstants.STATE_TYPE_READY,
      ),
      defaultValue: orderItemConstants.STATE_TYPE_PENDING
    },
    //user_id here refers to user who ordered the item
    user_id: DataTypes.INTEGER,
    //chef_id is the chef which this item belongs to
    chef_id: DataTypes.INTEGER,
    chef_location: DataTypes.STRING,
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    amount: DataTypes.DOUBLE,
    quantity: DataTypes.INTEGER,
  }, {});

  OrderItem.associate = function(models) {
    OrderItem.belongsTo(models.Order, {foreignKey: 'orderId', as: 'order'});
    OrderItem.hasOne(models.OrderDelivery);
    //OrderItem.belongsTo(models.Wallet, {foreignKey: 'walletId', as: 'wallet'})
    OrderItem.belongsTo(models.Plates, {foreignKey: 'plate_id', as: 'plate'})
    OrderItem.belongsTo(models.CustomPlateOrder, {foreignKey: 'customPlateId', as: 'custom_plate_order'})
    OrderItem.belongsTo(models.User, {foreignKey: 'user_id', as: 'user'})
    OrderItem.belongsTo(models.User, {foreignKey: 'chef_id', as: 'chef'})
  };
  return OrderItem;
};
