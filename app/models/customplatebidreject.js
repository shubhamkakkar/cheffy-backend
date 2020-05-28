'use strict';
/**
* @Model: CustomPlateBidReject
* It represents an bid rejected by  a customer for CustomPlateAuction Bid
*/
module.exports = (sequelize, DataTypes) => {
  const CustomPlateBidReject = sequelize.define('CustomPlateBidReject', {
    CustomPlateAuctionBidId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'CustomPlateAuctionBid',
        key: 'id'
      }
    },
    userId: {
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
  CustomPlateBidReject.associate = function(models) {
    CustomPlateBidReject.belongsTo(models.CustomPlateAuctionBid, {foreignKey: 'CustomPlateAuctionBidId', as: 'custom_plates_auction_bid'})
    CustomPlateBidReject.belongsTo(models.User, {foreignKey: 'userId', as: 'User'})
  };
  return CustomPlateBidReject;
};
