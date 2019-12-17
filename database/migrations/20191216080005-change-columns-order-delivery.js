'use strict';
const path = require('path');
const orderDeliveryConstants = require(path.resolve('app/constants/order-delivery'));

module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */

    return [
      queryInterface.removeColumn('OrderDeliveries', 'state_type'),
      queryInterface.removeColumn('OrderDeliveries', 'orderId'),
      queryInterface.addColumn('OrderDeliveries', 'state_type', {
        type: DataTypes.ENUM(
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
        type: DataTypes.INTEGER,
        references: {
          model: 'OrderItems',
          key: 'id'
        }
      }),
      queryInterface.addColumn('OrderDeliveries', 'orderId', {
        allowNull: true,
        type: DataTypes.INTEGER,
        references: {
          model: 'Orders',
          key: 'id'
        }
      }),
      queryInterface.addColumn('OrderDeliveries', 'order_delivery_type', {
        type: DataTypes.ENUM(
          orderDeliveryConstants.DELIVERY_TYPE_ORDER,
          orderDeliveryConstants.DELIVERY_TYPE_ORDER_ITEM
        )
      }),
      queryInterface.addColumn('OrderDeliveries', 'userId', {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        }
      }),
    ];
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */

    return [
      queryInterface.removeColumn('OrderDeliveries', 'state_type'),
      queryInterface.removeColumn('OrderDeliveries', 'orderId'),
      queryInterface.addColumn('OrderDeliveries', 'state_type', {
        type: DataTypes.ENUM(
          'pending','approved','rejected','canceled'
        ),
        defaultValue: 'pending'
      }),
      queryInterface.removeColumn('OrderDeliveries', 'orderItemID'),
      queryInterface.addColumn('OrderDeliveries', 'orderId', {
        allowNull: false,
        type: DataTypes.INTEGER,
        references: {
          model: 'Orders',
          key: 'id'
        }
      }),
      queryInterface.removeColumn('OrderDeliveries', 'order_delivery_type'),
      queryInterface.removeColumn('OrderDeliveries', 'userId')
    ];

  }
};
