'use strict';
/**
* @Model: ShippingAddress
* Stores shipping address of a user. For now a user can have only one shipping address
*/
module.exports = (sequelize, DataTypes) => {
  const ShippingAddress = sequelize.define('ShippingAddress', {
    addressLine1: DataTypes.STRING,
    addressLine2: DataTypes.STRING,
    city: DataTypes.STRING,
    state: DataTypes.STRING,
    zipCode: DataTypes.STRING,
    lat: DataTypes.STRING,
    lon: DataTypes.STRING,
    deliveryNote: DataTypes.STRING,
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    //to know if it is user's default shipping address
    isDefaultAddress: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
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
