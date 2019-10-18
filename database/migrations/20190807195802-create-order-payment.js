'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('OrderPayments', {
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
      payment_id: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      amount: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      client_secret: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      created: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      customer: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      payment_method: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      status: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      receipt_url: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      card_brand: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      card_country: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      card_exp_month: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      card_exp_year: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      card_fingerprint: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      card_last: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      network_status: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      risk_level: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      risk_score: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      seller_message: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      type: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      paid: {
        allowNull: true,
        type: Sequelize.STRING,
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
    return queryInterface.dropTable('OrderPayments');
  }
};
