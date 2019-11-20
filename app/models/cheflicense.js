'use strict';
module.exports = (sequelize, DataTypes) => {
  const ChefLicense = sequelize.define('ChefLicense', {
    description: DataTypes.STRING,
    url: {
      type: DataTypes.STRING,
      get() {
        return `${process.env.URL_SERVER}tmp/chef_license/${this.getDataValue('url')}`;
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
  ChefLicense.associate = function(models) {
    ChefLicense.belongsTo(models.Documents, {foreignKey: 'documentId', as: 'document', onDelete: 'cascade'})
  };
  return ChefLicense;
};
