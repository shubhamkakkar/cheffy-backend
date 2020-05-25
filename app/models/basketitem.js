'use strict';

const path = require('path');
const basketConstants = require(path.resolve('app/constants/baskets'));

/**
* @Model: BasketItem
* User basket item. When user adds plate or custom_plate to basket, BasketItem is created.
* User has many BasketItems and belongs to plate
*/
module.exports = (sequelize, DataTypes) => {
  const BasketItem = sequelize.define('BasketItem', {
    //order item note like extra napkins
    note: {
      type: DataTypes.STRING,
      allowNull: true
    },
    plateId: {
      allowNull: true,
      type: DataTypes.INTEGER,
      references: {
        model: 'Plates',
        key: 'id'
      }
    },
    quantity: DataTypes.INTEGER,
    basket_type: {
      type: DataTypes.ENUM(basketConstants.BASKET_TYPE_PLATE, basketConstants.BASKET_TYPE_CUSTOM_PLATE),
      defaultValue: basketConstants.BASKET_TYPE_PLATE
    },
    basketId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Baskets',
        key: 'id'
      }
    },
    customPlateId: {
      allowNull: true,
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
