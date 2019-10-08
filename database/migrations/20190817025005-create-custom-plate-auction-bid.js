'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('CustomPlateAuctionBids', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      CustomPlateAuctionID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'CustomPlateAuctions',
          key: 'id'
        }
      },
      chefID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id"
        }
      },
      price: {
        allowNull: false,
        type: Sequelize.DOUBLE,
      },
      preparation_time: {
        allowNull: true,
        type: Sequelize.DOUBLE,
      },
      winner: {
        allowNull: true,
        defaultValue: false,
        type: Sequelize.INTEGER
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
    return queryInterface.dropTable('CustomPlateAuctionBids');
  }
};
