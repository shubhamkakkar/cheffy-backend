module.exports = (sequelize, DataTypes) => {
  const ReceiptImage = sequelize.define('ReceiptImage', {
    name: DataTypes.STRING,
    url: {
      type: DataTypes.STRING,
      get() {
        return `${process.env.URL_SERVER}tmp/receipt_image/${this.getDataValue('url')}`;
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
  ReceiptImage.associate = function(models) {
    ReceiptImage.belongsTo(models.Plates, {foreignKey: 'plateId', as: 'plate', onDelete: 'cascade'})
  }
  return ReceiptImage;
}
