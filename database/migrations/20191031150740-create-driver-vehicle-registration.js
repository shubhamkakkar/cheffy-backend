'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('DriverVehicleRegistrations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      url: {
        type: Sequelize.STRING
      },
      state_type: {
        type: Sequelize.ENUM('validated', 'invalid', 'pending'),
        defaultValue: 'pending'
      },
      documentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Documents',
          key: 'id'
        },
        onDelete: "cascade"
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('DriverVehicleRegistrations');
  }
};