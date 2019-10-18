'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      basketId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Baskets',
          key: 'id'
        }
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id"
        }
      },
      shippingId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "ShippingAddresses",
          key: "id"
        }
      },
      state_type: {
        allowNull: false,
        type: Sequelize.ENUM('created', 'declined', 'canceled', 'pending', 'aproved'),
        defaultValue: "created"
      },
      total_itens: {
        type: Sequelize.INTEGER
      },
      shipping_fee: {
        type: Sequelize.DOUBLE
      },
      order_total: {
        type: Sequelize.DOUBLE
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
    return queryInterface.dropTable('Orders');
  }
};
