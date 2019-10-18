'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      // queryInterface.addColumn(
      //   'Users',
      //   'location_lat',
      //   {
      //     type: Sequelize.STRING,
      //     defaultValue: ''
      //   }
      // ),
      // queryInterface.addColumn(
      //   'Users',
      //   'location_lon',
      //   {
      //     type: Sequelize.STRING,
      //     defaultValue: ''
      //   }
      // ),
    ])
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Users', 'location_lat'),
      queryInterface.removeColumn('Users', 'location_lon')
    ]);
  }
};
