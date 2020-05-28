'use strict';
const path = require('path');
const orderConstants = require(path.resolve('app/constants/order'));

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.
    */
    await queryInterface.removeColumn('Orders',  'state_type');

    return queryInterface.addColumn('Orders', 'state_type', {
      type: Sequelize.ENUM(
        orderConstants.STATE_TYPE_PENDING,
        orderConstants.STATE_TYPE_APPROVED,
        orderConstants.STATE_TYPE_REJECTED,
        orderConstants.STATE_TYPE_CANCELED,
      ),
      defaultValue: orderConstants.STATE_TYPE_PENDING
    });

  },

  down: async (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.
    */
    await queryInterface.removeColumn('Orders',  'state_type');

    return queryInterface.addColumn('Orders', 'state_type', {
      type: Sequelize.ENUM('created', 'declined', 'canceled', 'pending', 'approved'),
      defaultValue: 'created'
    });

  }
};
