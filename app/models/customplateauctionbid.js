'use strict';
/**
* @Model: CustomPlateAuctionBid
* It represents a bid of a chef for CustomPlateAuction. When user accepts the bid, winner is set to 'true'
*/
module.exports = (sequelize, DataTypes) => {
  const CustomPlateAuctionBid = sequelize.define('CustomPlateAuctionBid', {
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
    price: DataTypes.DOUBLE,
    preparation_time: {
      allowNull: true,
      type: DataTypes.DOUBLE,
    },
    chefDeliveryAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    winner: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {});
  CustomPlateAuctionBid.associate = function(models) {
    CustomPlateAuctionBid.belongsTo(models.CustomPlateAuction, {foreignKey: 'CustomPlateAuctionID', as: 'custom_plates_id'})
    CustomPlateAuctionBid.belongsTo(models.User, {foreignKey: 'chefID', as: 'chef_id'})
  };
  return CustomPlateAuctionBid;
};
