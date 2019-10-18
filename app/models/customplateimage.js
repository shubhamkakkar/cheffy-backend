'use strict';
module.exports = (sequelize, DataTypes) => {
  const CustomPlateImage = sequelize.define('CustomPlateImage', {
    name: DataTypes.STRING,
    url: DataTypes.STRING,
    CustomPlateID: {
      type: DataTypes.INTEGER,
      references: {
        model: 'CustomPlates',
        key: 'id'
      }
    },
  }, {});
  CustomPlateImage.associate = function(models) {
    CustomPlateImage.belongsTo(models.CustomPlate, {foreignKey: 'CustomPlateID', as: 'custom_plates'})
  };
  return CustomPlateImage;
};
