'use strict';
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
      type: DataTypes.ENUM('open', 'locked'),
      defaultValue: 'open'
    },
  }, {});
  Wallet.associate = function(models) {
    Wallet.belongsTo(models.User, {foreignKey: 'userId', as: 'user'})
    Wallet.hasMany(models.OrderItem)
  };
  return Wallet;
};
