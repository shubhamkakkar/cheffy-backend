'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('orderitems', 'customPlateId',
    { 
      type: Sequelize.INTEGER,
      AllowNull: true,
      references: {
        model: 'CustomPlates',
        key: 'id'
      } 
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('orderitems', 'customPlateId');
  }
};
