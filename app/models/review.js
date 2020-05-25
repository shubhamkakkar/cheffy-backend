'use strict';
const path = require('path');
const reviewConstants = require(path.resolve('app/constants/reviews'));

/**
* @Model: Review
* review by a user
*/
module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define('Review', {
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
      AllowNull: true,
      references: {
        model: 'Plates',
        key: 'id'
      }
    },
    orderId:{
      type: DataTypes.INTEGER,
      AllowNull: true,
      references:{
        model: 'Order',
        key: 'id'
      }
    },
    orderItemId:{
      type: DataTypes.INTEGER,
      AllowNull: true,
      references:{
        model: 'OrderItems',
        key: 'id'
      }
    },
    rating: DataTypes.DOUBLE,
    comment: DataTypes.STRING,
    review_type: {
      type: DataTypes.ENUM(
        reviewConstants.REVIEW_TYPE_PLATE,
        reviewConstants.REVIEW_TYPE_CHEF,
        reviewConstants.REVIEW_TYPE_DRIVER
      ),
    },
    chefID: {
      type: DataTypes.INTEGER,
      AllowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    driverID: {
      type: DataTypes.INTEGER,
      AllowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    }


  }, {});
  Review.associate = function(models) {
  Review.belongsTo(models.User, {foreignKey: 'userId', as: 'user'})
  Review.belongsTo(models.User, {foreignKey: 'chefID', as: 'chef'})
  Review.belongsTo(models.User, {foreignKey: 'driverID', as: 'driver'})
  Review.belongsTo(models.Plates, {foreignKey: 'plateId', as: 'plate'})
  Review.belongsTo(models.Order, {foreignKey: 'orderId', as: 'order'})
  Review.belongsTo(models.OrderItem, {foreignKey: 'orderItemId', as: 'orderItem'})
  };
  return Review;
};
