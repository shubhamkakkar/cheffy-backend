'use strict';
/**
* @Model: ProfilePhoto
* Stores user profile photo url
*/
module.exports = (sequelize, DataTypes) => {
  const ProfilePhoto = sequelize.define('ProfilePhoto', {
    description: DataTypes.STRING,
    url: {
      type: DataTypes.STRING,
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
  ProfilePhoto.associate = function(models) {
    ProfilePhoto.belongsTo(models.Documents, {foreignKey: 'documentId', as: 'document', onDelete: 'cascade'})
  };
  return ProfilePhoto;
};
