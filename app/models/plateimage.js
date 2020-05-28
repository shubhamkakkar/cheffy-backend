'use strict';
/**
* @Model: PlateImage
* Stores image url of a plate
*/
module.exports = (sequelize, DataTypes) => {
  const PlateImage = sequelize.define('PlateImage', {
    name: DataTypes.STRING,
    url: {
      type: DataTypes.STRING,
    },
    plateId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Plates',
        key: 'id'
      }
    },
  });
  PlateImage.associate = function(models) {
    PlateImage.belongsTo(models.Plates, {foreignKey: 'plateId', as: 'plate', onDelete: 'cascade'})
  }
  return PlateImage;
}
