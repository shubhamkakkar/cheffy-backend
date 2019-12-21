'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('CustomPlateAuctionBids', 'delivery_time', {
      type: Sequelize.DOUBLE,
      allowNull: true
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Orders', 'delivery_time');
  }
};
