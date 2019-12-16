'use strict';
/**
* @Model: DriverVehicleRegistration
* It stores url of driver vehicle registration image.
*/
module.exports = (sequelize, DataTypes) => {
  const DriverVehicleRegistration = sequelize.define('DriverVehicleRegistration', {
    name: DataTypes.STRING,
    url: {
      type: DataTypes.STRING,
      get() {
        return `${process.env.URL_SERVER}tmp/driver_vehicle_registration/${this.getDataValue('url')}`;
      }
    },
    state_type: {
      type: DataTypes.ENUM('validated', 'invalid', 'pending'),
      defaultValue: 'pending'
    },
    documentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Documents',
        key: 'id'
      },
      onDelete: "cascade"
    },
  }, {});
  DriverVehicleRegistration.associate = function(models) {
    DriverVehicleRegistration.belongsTo(models.Documents, {foreignKey: 'documentId', as: 'document', onDelete: 'cascade'})
  };
  return DriverVehicleRegistration;
};
