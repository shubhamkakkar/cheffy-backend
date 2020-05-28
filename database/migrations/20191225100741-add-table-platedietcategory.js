/*
 * Migration
 */
'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable('PlateDietCategories', {
      plateId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Plates',
          key: 'id'
        }
      },
      dietCategoryId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'DietCategories',
          key: 'id'
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('PlateDietCategories');
  }
};
