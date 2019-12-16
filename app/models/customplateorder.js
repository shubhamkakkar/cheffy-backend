'use strict';
/**
* @Model: CustomPlateOrder
* CustomPlateOrder is created when a user accepts bid for auction for custom plate
* Also Basket and BasketItems are created for the CustomPlate
*/
module.exports = (sequelize, DataTypes) => {
  const CustomPlateOrder = sequelize.define('CustomPlateOrder', {
    customPlateId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'CustomPlates',
        key: 'id'
      }
    },
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
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'User',
        key: 'id'
      }
    },
    chefID: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    rating: DataTypes.INTEGER
  }, {});

  CustomPlateOrder.associate = function(models) {
    CustomPlateOrder.belongsTo(models.CustomPlate, {foreignKey: 'customPlateId', onDelete: 'cascade', as: 'custom_plate'});
    CustomPlateOrder.belongsTo(models.User, {foreignKey: 'userId', onDelete: 'cascade', as: 'user'});
    CustomPlateOrder.belongsTo(models.User, {foreignKey: 'chefID', onDelete: 'cascade', as: 'chef'});
  };

  return CustomPlateOrder;
};
