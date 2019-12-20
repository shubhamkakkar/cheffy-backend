'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */

    await queryInterface.removeColumn(
      'Documents',
      'social_security_number');

    return queryInterface.addColumn(
      'Documents',
      'social_security_number',
      {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      });
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
    return queryInterface.changeColumn(
          'Documents',
          'social_security_number',
          {
            type: Sequelize.STRING,
            allowNull: true
          });
  }
};
