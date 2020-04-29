'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('OrderItems', 'deletedAt',{
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('OrderItems', 'deletedAt');
  }
};
