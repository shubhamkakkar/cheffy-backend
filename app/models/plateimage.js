module.exports = (sequelize, DataTypes) => {
  const PlateImage = sequelize.define('PlateImage', {
    name: DataTypes.STRING,
    url: DataTypes.STRING,
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
