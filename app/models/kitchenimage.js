module.exports = (sequelize, DataTypes) => {
  const KitchenImage = sequelize.define('KitchenImage', {
    name: DataTypes.STRING,
    url: {
      type: DataTypes.STRING,
      get() {
        return `${process.env.URL_SERVER}tmp/kitchen_image/${this.getDataValue('url')}`;
      }
    },
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
