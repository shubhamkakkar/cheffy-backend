'use strict';

module.exports = (sequelize, DataTypes) => {
  const Reservation = sequelize.define('Reservation', {

    foodName: DataTypes.STRING,
    description: DataTypes.STRING,
    photo: DataTypes.STRING,
    chefRange: DataTypes.INTEGER,
    quantity: DataTypes.INTEGER,
    allDay: DataTypes.BOOLEAN,
    deliveryTime:DataTypes.STRING,
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
}, {freezeTableName: true,timestamps: false});
  Reservation.associate = function(models) {
    Reservation.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
      onDelete: 'cascade'
    });
  };
  return Reservation;
};