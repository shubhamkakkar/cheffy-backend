'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(
      'Reviews',
      'plateId',
      {
      type: Sequelize.INTEGER,
      AllowNull: true,
      references: {
        model: 'Plates',
        key: 'id'
      }
    })
  },

  down: (queryInterface, Sequelize) => {
    
  }
};
