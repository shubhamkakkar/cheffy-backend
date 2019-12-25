'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(
      'Reviews',
      'orderId',
      {
      type: Sequelize.INTEGER,
      AllowNull: true,
      references:{
        model: 'Orders'
      }
    })
  },

  down: (queryInterface, Sequelize) => {
    
  }
};
