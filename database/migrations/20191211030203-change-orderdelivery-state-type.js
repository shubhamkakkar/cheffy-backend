'use strict';
const path = require('path');
const orderDeliveryConstants = require(path.resolve('app/constants/order-delivery'));

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
    await queryInterface.removeColumn('OrderDeliveries',  'state_type');

    return Promise.all([
      queryInterface.addColumn('OrderDeliveries', 'state_type', {
        type: Sequelize.ENUM(
          orderDeliveryConstants.STATE_TYPE_PENDING,
          orderDeliveryConstants.STATE_TYPE_APPROVED,
          orderDeliveryConstants.STATE_TYPE_REJECTED,
          orderDeliveryConstants.STATE_TYPE_CANCELED
        ),
        defaultValue: orderDeliveryConstants.STATE_TYPE_PENDING
      })
    ]);
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
    return queryInterface.removeColumn('OrderDeliveries',  'state_type');

    //there was to state_type field before
    /*return queryInterface.addColumn('OrderDeliveries', 'state_type', {
      type: Sequelize.ENUM('created', 'canceled', 'on_course', 'delivered','driver_not_found','picked_up'),
      defaultValue: "created"
    });*/
  }
};
