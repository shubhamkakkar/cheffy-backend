'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Favourites', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'cascade'
      },
      CustomplateId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'CustomPlates',
          key: 'id'
        },
        onDelete: 'cascade'
      },
      plateId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Plates',
          key: 'id'
        },
        onDelete: 'cascade'
      },
      fav_type: {
        allowNull: false,
        type: Sequelize.ENUM('plate', 'custom_plate'),
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      }
    });

  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.dropTable('Favourites');
  }
};
