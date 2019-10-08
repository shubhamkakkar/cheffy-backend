'use strict';
module.exports = (sequelize, DataTypes) => {
  const PlateCategory = sequelize.define('PlateCategory', {
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    url: DataTypes.STRING,
  }, {});
  PlateCategory.associate = function(models) {
    //PlateCategory.hasMany(models.Plates)
  };
  return PlateCategory;
};
