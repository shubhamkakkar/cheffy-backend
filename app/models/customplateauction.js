'use strict';
const path = require('path');
const customPlateConstants = require(path.resolve('app/constants/custom-plates'));
/**
* @Model: CustomPlateAuction
* CustomPlateAuction is created for handling bidding. Chef user can bid for custom, plate.
* CustomPlateAuction expires when CustomPlate close_date is reached or it is closed.
* When user accepts a bid of a particular chef, winner is set to the chef user id.
*/
module.exports = (sequelize, DataTypes) => {
  const CustomPlateAuction = sequelize.define('CustomPlateAuction', {
    customPlateId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'CustomPlates',
        key: 'id'
      }
    },
    //added userId field
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    state_type: {
      type: DataTypes.ENUM(customPlateConstants.STATE_TYPE_OPEN, customPlateConstants.STATE_TYPE_CLOSED),
      defaultValue: customPlateConstants.STATE_TYPE_OPEN
    },
    winner: DataTypes.INTEGER,
  }, {});
  CustomPlateAuction.associate = function(models) {
    CustomPlateAuction.belongsTo(models.CustomPlate, {foreignKey: 'customPlateId', as: 'custom_plates'});
    CustomPlateAuction.hasMany(models.CustomPlateAuctionBid);
    CustomPlateAuction.belongsTo(models.User, {foreignKey: 'userId', onDelete: 'cascade'});
  };
  return CustomPlateAuction;
};
