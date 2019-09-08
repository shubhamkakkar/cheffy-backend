'use strict';
module.exports = (sequelize, DataTypes) => {
  const CustomPlateOrder = sequelize.define('CustomPlateOrder', {
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    price: DataTypes.DOUBLE,
    preparation_time: {
      allowNull: true,
      type: DataTypes.DOUBLE,
    },
    delivery_type: {
      type: DataTypes.ENUM('free', 'paid'),
      defaultValue: 'paid',
    },
    userId: DataTypes.INTEGER,
    rating: DataTypes.INTEGER
  }, {});
  CustomPlateOrder.associate = function(models) {
    // associations can be defined here
  };
  return CustomPlateOrder;
};
