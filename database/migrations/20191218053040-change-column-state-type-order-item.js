'use strict';
const path = require('path');
const orderItemConstants = require(path.resolve('app/constants/order-item'));

module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */

    return queryInterface.changeColumn('OrderItems', 'state_type', {
      type: Sequelize.ENUM(
        orderItemConstants.STATE_TYPE_PENDING,
        orderItemConstants.STATE_TYPE_APPROVED,
        orderItemConstants.STATE_TYPE_REJECTED,
        orderItemConstants.STATE_TYPE_CANCELED,
        orderItemConstants.STATE_TYPE_READY,
      ),
      defaultValue: orderItemConstants.STATE_TYPE_PENDING
    });
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
    return queryInterface.changeColumn('OrderItems', 'state_type', {
      type: Sequelize.ENUM(
        orderItemConstants.STATE_TYPE_PENDING,
        orderItemConstants.STATE_TYPE_APPROVED,
        orderItemConstants.STATE_TYPE_REJECTED,
        orderItemConstants.STATE_TYPE_CANCELED,
      ),
      defaultValue: orderItemConstants.STATE_TYPE_PENDING
    });
  }
};
