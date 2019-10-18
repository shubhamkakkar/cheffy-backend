'use strict';
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
      type: DataTypes.ENUM('created', 'canceled', 'on_course', 'delivered','driver_not_found','picked_up'),
      defaultValue: "created"
    },
  }, {});
  OrderDelivery.associate = function(models) {
    OrderDelivery.belongsTo(models.Order, {foreignKey: 'orderId', as: 'order'});
    OrderDelivery.belongsTo(models.User, {foreignKey: 'driverId'});
  };
  OrderDelivery.sync();
  return OrderDelivery;
};
