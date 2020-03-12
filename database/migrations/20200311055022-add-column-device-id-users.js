'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
      return queryInterface.addColumn('Users', 'device_id',{
        type: Sequelize.STRING
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Users', 'device_id');
  }
};
