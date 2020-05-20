'use strict';
const path = require('path');
const orderConstants = require(path.resolve('app/constants/order'));

/**
* @Model: Order
* Created when user checks out the cart.
*/

module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    basketId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Basket',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    state_type: {
      type: DataTypes.ENUM(
        orderConstants.STATE_TYPE_PENDING,
        orderConstants.STATE_TYPE_APPROVED,
        orderConstants.STATE_TYPE_REJECTED,
        orderConstants.STATE_TYPE_CANCELED,
      ),
      defaultValue: orderConstants.STATE_TYPE_PENDING
    },
    promoCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    total_items: DataTypes.INTEGER,
    shipping_fee: DataTypes.DOUBLE,
    order_total: DataTypes.DOUBLE
  }, {});
  Order.associate = function(models) {
    Order.belongsTo(models.User, {foreignKey: 'userId', as: 'user'})
    //Order.belongsTo(models.Basket, {foreignKey: 'basketId', as: 'basket'})
    //Order.belongsTo(models.ShippingAddress, {foreignKey: 'shippingId', as: 'shipping'})
    Order.hasMany(models.OrderPayment)
    Order.hasMany(models.OrderItem)
    Order.hasMany(models.OrderDelivery, {as:'order_delivery'})
    Order.hasMany(models.Transactions)
  };
  return Order;
};
