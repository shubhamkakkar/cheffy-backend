'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('BasketItems', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
      quantity: {
        type: Sequelize.INTEGER
      },
      basketId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Baskets',
          key: 'id'
        },
        onDelete: 'cascade'
      },
      customPlateId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'CustomPlateOrders',
          key: 'id'
        }
      },
      basket_type: {
        type: Sequelize.ENUM('plate', 'custom_plate'),
        defaultValue: "plate"
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
    return queryInterface.dropTable('BasketItems');
  }
};
