'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(
      'Plates',
      'rating',
      {
        type: Sequelize.DOUBLE
      })
  },

  down: (queryInterface, Sequelize) => {
    
  }
};
