'use strict';
const path = require('path');
const documentConstants = require(path.resolve('app/constants/documents'));
/**
* @Model: Documents
* User document table
* stores ssn, licenses, profile_photo etc.
*/
module.exports = (sequelize, DataTypes) => {
  const Documents = sequelize.define('Documents', {
    comment: DataTypes.STRING,
    state_type: {
      type: DataTypes.ENUM(
        documentConstants.STATUS_SUBMITTED,
        documentConstants.STATUS_PENDING,
        documentConstants.STATUS_APPROVED,
        documentConstants.STATUS_REJECTED
      ),
      defaultValue: documentConstants.STATUS_PENDING
    },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    social_security_number: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Social security number is empty!'
        }
      }
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
