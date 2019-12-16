'use strict';
const path = require('path');
const orderPaymentConstants = require(path.resolve('app/constants/order-payment'));


module.exports = {
  up: async (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
    await queryInterface.removeColumn('OrderPayments',  'status');

    return queryInterface.addColumn('OrderPayments', 'status', {
      type: Sequelize.ENUM(
        orderPaymentConstants.STATUS_PROCESSING,
        orderPaymentConstants.STATUS_REQUIRES_PAYMENT_METHOD,
        orderPaymentConstants.STATUS_REQUIRES_CONFIRMATION,
        orderPaymentConstants.STATUS_REQUIRES_CAPTURE,
        orderPaymentConstants.STATUS_CANCELED,
        orderPaymentConstants.STATUS_SUCCEEDED
      ),
      defaultValue: orderPaymentConstants.STATUS_PROCESSING,
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
    await queryInterface.removeColumn('OrderPayments',  'status');

    return queryInterface.addColumn('OrderPayments', 'status', {
      type: Sequelize.ENUM('created', 'declined', 'canceled', 'pending', 'aproved'),
      defaultValue: "created",
      allowNull: true
    });
  }
};
