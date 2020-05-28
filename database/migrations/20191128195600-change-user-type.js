'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(
      'Users',
      'user_type',
      {
        type: Sequelize.ENUM('pending', 'user', 'chef', 'admin', 'driver'),
        allowNull: true
      })
  },

  down: (queryInterface, Sequelize) => {
    
  }
};
