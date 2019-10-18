'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('OrderDeliveries', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      orderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Orders",
          key: "id"
        }
      },
      rating: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      driverId: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      pickup_time: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      dropoff_time: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      state_type: {
        allowNull: false,
        type: Sequelize.ENUM('created', 'declined', 'canceled', 'on_course', 'delivered','driver_not_found','picked_up'),
        defaultValue: "created"
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('OrderDeliveries');
  }
};
