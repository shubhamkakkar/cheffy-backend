'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Transactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      entry_type: {
        allowNull: false,
        type: Sequelize.ENUM('C', 'D')
      },
      identifier: {
        allowNull: false,
        type: Sequelize.ENUM('order_payment', 'withdraw'),
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id"
        }
      },
      orderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Orders",
          key: "id"
        }
      },       
      orderPaymentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "OrderPayments",
          key: "id"
        }
      },      
      orderItemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "OrderItems",
          key: "id"
        }
      },            
      amount: {
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
    return queryInterface.dropTable('Transactions');
  }
};