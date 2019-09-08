'use strict';
module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    basketId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'BasketItems',
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
    shippingId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'ShippingAddresses',
        key: 'id'
      }
    },
    state_type: {
      type: DataTypes.ENUM('created', 'declined', 'canceled', 'pending', 'approved'),
      defaultValue: 'created'
    },
    total_itens: DataTypes.INTEGER,
    shipping_fee: DataTypes.DOUBLE,
    order_total: DataTypes.DOUBLE
  }, {});
  Order.associate = function(models) {
    Order.belongsTo(models.User, {foreignKey: 'userId', as: 'user'})
    Order.belongsTo(models.Basket, {foreignKey: 'basketId', as: 'basket'})
    Order.belongsTo(models.ShippingAddress, {foreignKey: 'shippingId', as: 'shipping'})
    Order.hasMany(models.OrderPayment)
    Order.hasMany(models.OrderItem)
    Order.hasMany(models.OrderDelivery)
    Order.hasMany(models.Transactions)
  };
  return Order;
};
