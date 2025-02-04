'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
    return Promise.all([
      queryInterface.changeColumn(
        'Users',
        'email',
        {
          type: Sequelize.STRING,
          unique: true
      }),
      queryInterface.changeColumn(
        'Users',
        'phone_no',
        {
          type: Sequelize.STRING,
          unique: true
      })
    ]);
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
    return Promise.all([
      queryInterface.changeColumn(
        'Users',
        'email',
        {
          type: Sequelize.STRING
      }),
      queryInterface.changeColumn(
        'Users',
        'phone_no',
        {
          type: Sequelize.STRING
      })
    ]);
  }
};
