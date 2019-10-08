module.exports = (sequelize, DataTypes) => {
  const KitchenImage = sequelize.define('KitchenImage', {
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
  KitchenImage.associate = function(models) {
    KitchenImage.belongsTo(models.Plates, {foreignKey: 'plateId', as: 'plate', onDelete: 'cascade'})
  }
  return KitchenImage;
}
