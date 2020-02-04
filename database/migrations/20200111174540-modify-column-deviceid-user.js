'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(
      'Users',
      'device_id',
      {
      type: Sequelize.STRING
    })
  },

  down: (queryInterface, Sequelize) => {
    
  }
};
