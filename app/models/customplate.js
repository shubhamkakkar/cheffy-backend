'use strict';
/**
* @Model: CustomPlate
* User can upload their own plate with images so that chef can bid on it.
* When a user creates CustomPlate, CustomPlateAuction is created for handling bidding.
* CustomPlate Image is stored in CustomPlateImage
* CustomPlate expires when close_date is reached
*/

//TODO inconsistency in naming models
//in plate there is Plates (plural), while here in this model it is CustomPlate(singular)
module.exports = (sequelize, DataTypes) => {
  const CustomPlate = sequelize.define('CustomPlate', {
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    price_min: DataTypes.DOUBLE,
    price_max: DataTypes.DOUBLE,
    quantity: DataTypes.DOUBLE,
    close_date: DataTypes.DATE,
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
  }, {});
  CustomPlate.associate = function(models) {
    CustomPlate.hasOne(models.CustomPlateAuction);
    //CustomPlate.hasOne(models.CustomPlateOrder);
    CustomPlate.hasMany(models.CustomPlateImage);
    CustomPlate.belongsTo(models.User, {foreignKey: 'userId', onDelete: 'cascade'});
  };

  return CustomPlate;
};
