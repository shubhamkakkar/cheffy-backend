'use strict';
const path = require('path');
const orderItemConstants = require(path.resolve('app/constants/order-item'));

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('OrderItems', 'deliveryType', {
      type: Sequelize.ENUM(
        orderItemConstants.DELIVERY_TYPE_CHEF,
        orderItemConstants.DELIVERY_TYPE_DRIVER,
        orderItemConstants.DELIVERY_TYPE_USER
      ),
      defaultValue: orderItemConstants.DELIVERY_TYPE_USER
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('OrderItems', 'deliveryType');
  }
};
