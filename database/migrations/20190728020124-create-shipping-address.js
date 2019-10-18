'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("ShippingAddresses", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      addressLine1: {
        type: Sequelize.STRING
      },
      addressLine2: {
        type: Sequelize.STRING
      },
      city: {
        type: Sequelize.STRING
      },
      state: {
        type: Sequelize.STRING
      },
      zipCode: {
        type: Sequelize.STRING
      },
      lat: {
        type: Sequelize.STRING
      },
      lon: {
        type: Sequelize.STRING
      },
      lon: {
        type: Sequelize.STRING
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id"
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
    return queryInterface.dropTable('ShippingAddresses');
  }
};