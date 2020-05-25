'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(
      'Reviews',
      'orderItemId',
      {
      type: Sequelize.INTEGER,
      AllowNull: true,
      references:{
        model: 'OrderItems',
        key: 'id'
      }
    })
  },

  down: (queryInterface, Sequelize) => {
    
  }
};
