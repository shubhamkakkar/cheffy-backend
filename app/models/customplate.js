'use strict';
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
    CustomPlate.hasMany(models.CustomPlateImage);
  };
  return CustomPlate;
};
