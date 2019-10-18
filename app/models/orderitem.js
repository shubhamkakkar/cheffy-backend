'use strict';
module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define('OrderItem', {
    orderId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Orders',
        key: 'id'
      }
    },
    walletId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Wallets',
        key: 'id'
      }
    },
    plate_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    chef_location: DataTypes.STRING,
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    amount: DataTypes.DOUBLE,
    quantity: DataTypes.INTEGER,
  }, {});
  OrderItem.associate = function(models) {
    OrderItem.belongsTo(models.Order, {foreignKey: 'orderId', as: 'order'})
    OrderItem.belongsTo(models.Wallet, {foreignKey: 'walletId', as: 'wallet'})
    OrderItem.belongsTo(models.Plates, {foreignKey: 'plate_id', as: 'plate'})
  };
  return OrderItem;
};
