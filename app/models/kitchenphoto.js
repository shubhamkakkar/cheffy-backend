'use strict';
module.exports = (sequelize, DataTypes) => {
  const KitchenPhoto = sequelize.define('KitchenPhoto', {
    description: DataTypes.STRING,
    url: {
      type: DataTypes.STRING,
      get() {
        return `${process.env.URL_SERVER}tmp/kitchen_photo/${this.getDataValue('url')}`;
      }
    },
    state_type: {
      type: DataTypes.ENUM('validated', 'invalid', 'pending'),
      defaultValue: 'pending'
    },
    documentId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Documents',
        key: 'id'
      }
    },
  }, {});
  KitchenPhoto.associate = function(models) {
    KitchenPhoto.belongsTo(models.Documents, {foreignKey: 'documentId', as: 'document', onDelete: 'cascade'})
  };
  return KitchenPhoto;
};
