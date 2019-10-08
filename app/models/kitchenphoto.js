'use strict';
module.exports = (sequelize, DataTypes) => {
  const KitchenPhoto = sequelize.define('KitchenPhoto', {
    description: DataTypes.STRING,
    url: DataTypes.STRING,
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
