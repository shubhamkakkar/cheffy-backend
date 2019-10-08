'use strict';
module.exports = (sequelize, DataTypes) => {
  const BasketItem = sequelize.define('BasketItem', {
    plateId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Plates',
        key: 'id'
      }
    },
    quantity: DataTypes.INTEGER,
    basket_type: {
      type: DataTypes.ENUM('plate', 'custom_plate'),
      defaultValue: 'plate'
    },
    basketId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Baskets',
        key: 'id'
      }
    },
    customPlateId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'CustomPlateOrders',
        key: 'id'
      }
    },
  }, {});
  BasketItem.associate = function(models) {
    BasketItem.belongsTo(models.Basket, {foreignKey: 'basketId', as: 'basket'})
    BasketItem.belongsTo(models.Plates, {foreignKey: 'plateId', as: 'plate'})
    BasketItem.belongsTo(models.CustomPlateOrder, {foreignKey: 'customPlateId', as: 'custom_plate'})
  };
  BasketItem.sync();
  return BasketItem;
};
