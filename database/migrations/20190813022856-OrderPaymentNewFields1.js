'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      // queryInterface.addColumn(
      //   'OrderItems',
      //   'chef_payment',
      //   {
      //     type: Sequelize.BOOLEAN,
      //     defaultValue: false
      //   }
      // ),
      // queryInterface.addColumn(
      //   'OrderItems',
      //   'chef_payment_date',
      //   {
      //     type: Sequelize.STRING,
      //     defaultValue: ''
      //   }
      // ),
    ])
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('OrderItems', 'chef_payment'),
      queryInterface.removeColumn('OrderItems', 'chef_payment_date')
    ]);
  }
};
