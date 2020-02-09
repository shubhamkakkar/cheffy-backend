'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Users', 'device_id', {
      type: Sequelize.DOUBLE
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Users', 'device_id');
  }
};
