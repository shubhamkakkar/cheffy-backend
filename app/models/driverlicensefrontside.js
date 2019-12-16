'use strict';
/**
* @Model: DriverLicenseFrontSide
* As the model name suggests it stores url of driver license image front side.
*/
module.exports = (sequelize, DataTypes) => {
  const DriverLicenseFrontSide = sequelize.define('DriverLicenseFrontSide', {
    name: DataTypes.STRING,
    url: {
      type: DataTypes.STRING,
      get() {
        return `${process.env.URL_SERVER}tmp/driver_license_front_side/${this.getDataValue('url')}`;
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
  DriverLicenseFrontSide.associate = function(models) {
    DriverLicenseFrontSide.belongsTo(models.Documents, {foreignKey: 'documentId', as: 'document', onDelete: 'cascade'})
  };
  return DriverLicenseFrontSide;
};
