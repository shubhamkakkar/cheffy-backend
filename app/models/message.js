'use strict';
module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    from_userid: DataTypes.INTEGER,
    to_userid: DataTypes.INTEGER,
    message: DataTypes.TEXT,
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
  }, {});
  Message.associate = function(models) {
    Message.belongsTo(models.User, {foreignKey: 'userId', as: 'user', onDelete: 'cascade'})
  };
  return Message;
};