'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('CustomPlateAuctions', 'deletedAt',{
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('CustomPlateAuctions', 'deletedAt');
  }
};
