'use strict';
const path = require('path');
const reviewConstants = require(path.resolve('app/constants/reviews'));

/**
* @Model: AggregateReview
*/
module.exports = (sequelize, DataTypes) => {
  const AggregateReview = sequelize.define('AggregateReview', {

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
    },
    plateId: {
      type: DataTypes.INTEGER,
      AllowNull: true,
      references: {
        model: 'Plates',
        key: 'id'
      }
    },
    userCount: {
      type: DataTypes.INTEGER
    },
    rating: DataTypes.DOUBLE



  }, {});
  AggregateReview.associate = function(models) {
  AggregateReview.belongsTo(models.User, {foreignKey: 'driverID', as: 'driver'})
  AggregateReview.belongsTo(models.User, {foreignKey: 'chefID', as: 'chef'})
  AggregateReview.belongsTo(models.Plates, {foreignKey: 'plateId', as: 'plate'})
  };
  return AggregateReview;
};
