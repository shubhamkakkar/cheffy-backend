'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Users', 'order_flag', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    });
  },

  down: (queryInterface, Sequelize) => {   
    return queryInterface.removeColumn('Users', 'order_flag')
  }
};
