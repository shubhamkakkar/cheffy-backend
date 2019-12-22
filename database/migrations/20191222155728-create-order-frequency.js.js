/*
 * Migration
 */
'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable('OrderFrequencies', {
      plate1: {
        type: Sequelize.INTEGER
      },
      plate2: {
        type: Sequelize.INTEGER
      },
      frequency: {
        type: Sequelize.INTEGER
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
    .then(() => {
      return queryInterface.sequelize.query('ALTER TABLE `OrderFrequencies` ADD CONSTRAINT `plateCombinations` PRIMARY KEY (`plate1`, `plate2`)');
    })
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('OrderFrequencies');
  }
};
