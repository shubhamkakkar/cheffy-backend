'use strict';
const path = require('path');
const orderDeliveryConstants = require(path.resolve('app/constants/order-delivery'));


module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('OrderDeliveries', 'delivery_type', {
      type: Sequelize.ENUM(
        orderDeliveryConstants.DELIVERY_TYPE_CHEF,
        orderDeliveryConstants.DELIVERY_TYPE_DRIVER,
        orderDeliveryConstants.DELIVERY_TYPE_USER
      )
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('OrderDeliveries', 'delivery_type');
  }
};
