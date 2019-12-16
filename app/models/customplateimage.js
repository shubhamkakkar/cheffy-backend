'use strict';
/**
* @Model: CustomPlateImage
* Stores CustomPlate image url
* A CustomPlate can have multiple images stored
*/
module.exports = (sequelize, DataTypes) => {
  const CustomPlateImage = sequelize.define('CustomPlateImage', {
    name: DataTypes.STRING,
    url: DataTypes.STRING,
    customPlateId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'CustomPlates',
        key: 'id'
      }
    },
  }, {});
  CustomPlateImage.associate = function(models) {
    CustomPlateImage.belongsTo(models.CustomPlate, {foreignKey: 'customPlateId', as: 'custom_plates'})
  };
  return CustomPlateImage;
};
