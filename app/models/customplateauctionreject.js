'use strict';
/**
* @Model: CustomPlateAuctionReject
* It represents an auction rejected by  a chef for CustomPlateAuction
*/
module.exports = (sequelize, DataTypes) => {
  const CustomPlateAuctionReject = sequelize.define('CustomPlateAuctionReject', {
    CustomPlateAuctionID: {
      type: DataTypes.INTEGER,
      references: {
        model: 'CustomPlateAuctions',
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
    reject_reason: {
      allowNull: true,
      type:DataTypes.STRING
    }
  }, {});
  CustomPlateAuctionReject.associate = function(models) {
    CustomPlateAuctionReject.belongsTo(models.CustomPlateAuction, {foreignKey: 'CustomPlateAuctionID', as: 'custom_plates_id'})
    CustomPlateAuctionReject.belongsTo(models.User, {foreignKey: 'chefID', as: 'Chef'})
  };
  return CustomPlateAuctionReject;
};
