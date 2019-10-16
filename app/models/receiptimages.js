module.exports = (sequelize, DataTypes) => {
  const ReceiptImage = sequelize.define('ReceiptImage', {
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
  ReceiptImage.associate = function(models) {
    ReceiptImage.belongsTo(models.Plates, {foreignKey: 'plateId', as: 'plate', onDelete: 'cascade'})
  }
  return ReceiptImage;
}
