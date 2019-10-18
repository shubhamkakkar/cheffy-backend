'use strict';
module.exports = (sequelize, DataTypes) => {
  const ShippingAddress = sequelize.define('ShippingAddress', {
    addressLine1: DataTypes.STRING,
    addressLine2: DataTypes.STRING,
    city: DataTypes.STRING,
    state: DataTypes.STRING,
    zipCode: DataTypes.STRING,
    lat: DataTypes.STRING,
    lon: DataTypes.STRING,
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
  }, {});
  ShippingAddress.associate = function(models) {
    ShippingAddress.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
      onDelete: 'cascade'
    });
  };
  return ShippingAddress;
};
