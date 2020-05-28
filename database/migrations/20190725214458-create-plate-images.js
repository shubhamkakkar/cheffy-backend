'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('PlateImages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      url: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      plateId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Plates',
          key: 'id'
        },
        onDelete: 'cascade'
      },
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('PlateImages');
  }
};
