'use strict';
module.exports = (sequelize, DataTypes) => {
  const DriverCancellation = sequelize.define('DriverCancellation', {
    driverId: DataTypes.INTEGER,
    orderId: DataTypes.INTEGER,
    isDelivered: DataTypes.BOOLEAN
  }, {});

  DriverCancellation.associate = function(models) {
    // associations can be defined here
  };

  return DriverCancellation;
};