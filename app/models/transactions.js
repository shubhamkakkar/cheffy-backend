'use strict';
module.exports = (sequelize, DataTypes) => {
  const Transactions = sequelize.define('Transactions', {
    entry_type: {
      type:DataTypes.ENUM('C','D'),
      AllowNull: false,
    },
    identifier: {
      type:DataTypes.STRING('order_payment','withdraw'),
      AllowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      AllowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },    
    orderId:{
      type: DataTypes.INTEGER,
      references:{
        model: 'Order',
        key: 'id'
      }
    },
    orderPaymentId:{
      type: DataTypes.INTEGER,
      references:{
        model: 'OrderPayments',
        key: 'id'
      }
    },
    orderItemId:{
      type: DataTypes.INTEGER,
      references:{
        model: 'OrderItems',
        key: 'id'
      }
    },
    amount: DataTypes.DOUBLE
  }, {});
  Transactions.associate = function(models) {
    Transactions.belongsTo(models.User, {foreignKey: 'userId', as: 'user'})
  };
  return Transactions;
};