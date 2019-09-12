'use strict';
module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    from_userid: DataTypes.INTEGER,
    to_userid: DataTypes.INTEGER,
    message: DataTypes.TEXT
  }, {});
  Message.associate = function(models) {
    // associations can be defined here
  };
  return Message;
};