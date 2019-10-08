'use strict';
module.exports = (sequelize, DataTypes) => {
  const CustomPlateAuction = sequelize.define('CustomPlateAuction', {
    CustomPlateID: {
      type: DataTypes.INTEGER,
      references: {
        model: 'CustomPlates',
        key: 'id'
      }
    },
    state_type: {
      type: DataTypes.ENUM('open', 'closed'),
      defaultValue: 'open'
    },
    winner: DataTypes.INTEGER,
  }, {});
  CustomPlateAuction.associate = function(models) {
    CustomPlateAuction.belongsTo(models.CustomPlate, {foreignKey: 'CustomPlateID', as: 'custom_plates'})
    CustomPlateAuction.hasMany(models.CustomPlateAuctionBid);
  };
  return CustomPlateAuction;
};
