'use strict';
/**
* @Model: PlateReview
* review of a plate by a user
*/
module.exports = (sequelize, DataTypes) => {
  const PlateReview = sequelize.define('PlateReview', {
    userId: {
      type: DataTypes.INTEGER,
      AllowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    plateId: {
      type: DataTypes.INTEGER,
      AllowNull: false,
      references: {
        model: 'Plates',
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
    orderItemId:{
      type: DataTypes.INTEGER,
      references:{
        model: 'OrderItems',
        key: 'id'
      }
    },
    rating: DataTypes.INTEGER,
    comment: DataTypes.STRING
  }, {});
  PlateReview.associate = function(models) {
    PlateReview.belongsTo(models.User, {foreignKey: 'userId', as: 'user'})
    PlateReview.belongsTo(models.Plates, {foreignKey: 'plateId', as: 'plate'})
    PlateReview.belongsTo(models.Order, {foreignKey: 'orderId', as: 'order'})
    PlateReview.belongsTo(models.OrderItem, {foreignKey: 'orderItemId', as: 'orderItem'})
  };
  return PlateReview;
};
