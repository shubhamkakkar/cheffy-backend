'use strict';
const path = require('path');
const walletConstants = require(path.resolve('app/constants/wallet'));

/**
* @Model: Wallet
* Wallet Table
*/
module.exports = (sequelize, DataTypes) => {
  const Wallet = sequelize.define('Wallet', {
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    state_type: {
      type: DataTypes.ENUM(walletConstants.WALLET_TYPE_OPEN, walletConstants.WALLET_TYPE_LOCKED),
      defaultValue: walletConstants.WALLET_TYPE_OPEN
    },
  }, {});
  Wallet.associate = function(models) {
    Wallet.belongsTo(models.User, {foreignKey: 'userId', as: 'user'})
    Wallet.hasMany(models.OrderItem)
  };
  return Wallet;
};
