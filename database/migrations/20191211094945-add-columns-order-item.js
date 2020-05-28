'use strict';
const path = require('path');
const basketConstants = require(path.resolve('app/constants/baskets'));

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */

    await queryInterface.addColumn('OrderItems', 'customPlateId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'CustomPlateOrders',
        key: 'id'
      }
    });

    return queryInterface.addColumn('OrderItems', 'item_type', {
      type: Sequelize.ENUM(basketConstants.BASKET_TYPE_PLATE, basketConstants.BASKET_TYPE_CUSTOM_PLATE),
      defaultValue: basketConstants.BASKET_TYPE_PLATE
    });
  },

  down: async (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */

    await queryInterface.removeColumn('OrderItems', 'customPlateId');

    return queryInterface.removeColumn('OrderItems', 'item_type');
  }
};
