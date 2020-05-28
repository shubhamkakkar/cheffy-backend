'use strict';
/**
* @Model: ChefCertificate
* Stores chef's certificate document url, state_type. It belongs to particular document of a chef
*/
module.exports = (sequelize, DataTypes) => {
  const ChefCertificate = sequelize.define('ChefCertificate', {
    description: DataTypes.STRING,
    url: {
      type: DataTypes.STRING      
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
  ChefCertificate.associate = function(models) {
    ChefCertificate.belongsTo(models.Documents, {foreignKey: 'documentId', as: 'document', onDelete: 'cascade'})
  };
  return ChefCertificate;
};
