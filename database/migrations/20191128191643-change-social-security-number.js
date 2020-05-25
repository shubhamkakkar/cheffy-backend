'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(
      'Documents',
      'social_security_number',
      {
        type: Sequelize.STRING,
        allowNull: true
      })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(
          'Documents',
          'social_security_number',
          {
            type: Sequelize.STRING,
            allowNull: true
          })
  }
};
