'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Wallets', 'balance', {
      type: Sequelize.DOUBLE
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Wallets', 'balance');
  }
};
