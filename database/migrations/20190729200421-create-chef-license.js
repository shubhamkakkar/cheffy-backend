'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("ChefLicenses", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      description: {
        type: Sequelize.STRING
      },
      url: {
        type: Sequelize.STRING
      },
      state_type: {
        allowNull: false,
        type: Sequelize.ENUM("validated", "invalid", "pending"),
        defaultValue: "pending"
      },
      documentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Documents",
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
    return queryInterface.dropTable('ChefLicenses');
  }
};
