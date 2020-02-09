'use strict';

module.exports = (sequelize, DataTypes) => {
  const UserAuthTokens = sequelize.define('UserAuthTokens', {
    auth_token: DataTypes.STRING,
    device: DataTypes.STRING,
    ip: DataTypes.STRING,
    updatedAt: DataTypes.DATE,
    createdAt: DataTypes.DATE
  });

  UserAuthTokens.associate = function(models) {
    UserAuthTokens.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
      onDelete: 'cascade'
    });
  };
  return UserAuthTokens;
};
