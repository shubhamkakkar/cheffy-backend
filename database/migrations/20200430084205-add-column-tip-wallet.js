'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Wallets', 'tip', {
      type: Sequelize.DOUBLE
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Wallets', 'tip');
  }
};
