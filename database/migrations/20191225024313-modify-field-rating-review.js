'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(
      'Reviews',
      'rating',
      {
        type: Sequelize.DOUBLE
      })
  },

  down: (queryInterface, Sequelize) => {
    
  }
};
