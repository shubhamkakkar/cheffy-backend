'use strict';
module.exports = (sequelize, DataTypes) => {
  const Documents = sequelize.define('Documents', {
    comment: DataTypes.STRING,
    state_type: {
      type: DataTypes.ENUM('validated', 'invalid', 'pending'),
      defaultValue: 'pending'
    },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    social_security_number: {
      type: DataTypes.STRING
    },
  }, {});
  Documents.associate = function(models) {
    Documents.belongsTo(models.User, {foreignKey: 'userId', as: 'user', onDelete: 'cascade'})
    Documents.hasOne(models.ChefLicense);
    Documents.hasOne(models.ChefCertificate);
    Documents.hasOne(models.KitchenPhoto);
    Documents.hasOne(models.NIDFrontSide);
    Documents.hasOne(models.ProfilePhoto);
    Documents.hasOne(models.DriverLicenseFrontSide);
    Documents.hasOne(models.DriverVehicleRegistration);
  };
  return Documents;
};
