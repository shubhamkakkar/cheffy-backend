'use strict';
module.exports = (sequelize, DataTypes) => {
  const ChefCertificate = sequelize.define('ChefCertificate', {
    description: DataTypes.STRING,
    url: {
      type: DataTypes.STRING,
      get() {
        return `${process.env.URL_SERVER}tmp/chef_certificate/${this.getDataValue('url')}`;
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
  ChefCertificate.associate = function(models) {
    ChefCertificate.belongsTo(models.Documents, {foreignKey: 'documentId', as: 'document', onDelete: 'cascade'})
  };
  return ChefCertificate;
};
