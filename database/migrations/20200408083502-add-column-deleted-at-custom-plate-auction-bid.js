'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('CustomPlateAuctionBids', 'deletedAt',{
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('CustomPlateAuctionBids', 'deletedAt');
  }
};
