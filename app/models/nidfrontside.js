'use strict';
module.exports = (sequelize, DataTypes) => {
  const NIDFrontSide = sequelize.define('NIDFrontSide', {
    description: DataTypes.STRING,
    url: {
      type: DataTypes.STRING,
      get() {
        return `${process.env.URL_SERVER}tmp/front_side/${this.getDataValue('url')}`;
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
  NIDFrontSide.associate = function(models) {
    NIDFrontSide.belongsTo(models.Documents, {foreignKey: 'documentId', as: 'document', onDelete: 'cascade'})
  };
  return NIDFrontSide;
};
