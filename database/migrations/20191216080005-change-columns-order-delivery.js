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
    await queryInterface.removeColumn('OrderDeliveries', 'state_type');
    await queryInterface.removeColumn('OrderDeliveries', 'orderId');
    await queryInterface.removeColumn('OrderDeliveries', 'orderItemID');
    await queryInterface.removeColumn('OrderDeliveries', 'order_delivery_type');
    await queryInterface.removeColumn('OrderDeliveries', 'userId');

    return Promise.all([

      queryInterface.addColumn('OrderDeliveries', 'state_type', {
        type: Sequelize.ENUM(
          orderDeliveryConstants.STATE_TYPE_PENDING,
          orderDeliveryConstants.STATE_TYPE_APPROVED,
          orderDeliveryConstants.STATE_TYPE_REJECTED,
          orderDeliveryConstants.STATE_TYPE_CANCELED,
          orderDeliveryConstants.STATE_TYPE_DELIVERED,
          orderDeliveryConstants.STATE_TYPE_PICKED_UP,
          orderDeliveryConstants.STATE_TYPE_DRIVER_NOT_FOUND,
        ),
        defaultValue: orderDeliveryConstants.STATE_TYPE_PENDING
      }),
      queryInterface.addColumn('OrderDeliveries', 'orderItemID', {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: {
          model: 'OrderItems',
          key: 'id'
        }
      }),
      queryInterface.addColumn('OrderDeliveries', 'orderId', {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: {
          model: 'Orders',
          key: 'id'
        }
      }),
      queryInterface.addColumn('OrderDeliveries', 'order_delivery_type', {
        type: Sequelize.ENUM(
          orderDeliveryConstants.DELIVERY_TYPE_ORDER,
          orderDeliveryConstants.DELIVERY_TYPE_ORDER_ITEM
        )
      }),
      queryInterface.addColumn('OrderDeliveries', 'userId', {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        }
      }),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
    await queryInterface.removeColumn('OrderDeliveries', 'orderId');
    await queryInterface.removeColumn('OrderDeliveries', 'orderItemID');
    await queryInterface.removeColumn('OrderDeliveries', 'order_delivery_type');
    await queryInterface.removeColumn('OrderDeliveries', 'userId');


    return Promise.all([

      queryInterface.removeColumn('OrderDeliveries', 'state_type'),
      queryInterface.addColumn('OrderDeliveries', 'state_type', {
        type: Sequelize.ENUM(
          'pending','approved','rejected','canceled'
        ),
        defaultValue: 'pending'
      }),
      queryInterface.addColumn('OrderDeliveries', 'orderId', {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'Orders',
          key: 'id'
        }
      })
    ]);

  }
};
