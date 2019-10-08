'use strict';
module.exports = (sequelize, DataTypes) => {
  const DriverFinder = sequelize.define('DriverFinder', {
    driver_id: DataTypes.INTEGER,
    order_delivery_id: DataTypes.INTEGER,
    sequence: DataTypes.INTEGER,
  }, {});
  DriverFinder.associate = function(models) {
    // associations can be defined here
  };
  return DriverFinder;
};