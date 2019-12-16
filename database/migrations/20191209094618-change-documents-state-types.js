'use strict';
const path = require('path');
const documentConstants = require(path.resolve('app/constants/documents'));


module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
    return queryInterface.changeColumn('Documents', 'state_type', {
      type: Sequelize.ENUM(
        documentConstants.STATUS_SUBMITTED,
        documentConstants.STATUS_PENDING,
        documentConstants.STATUS_APPROVED,
        documentConstants.STATUS_REJECTED
      ),
      defaultValue: documentConstants.STATUS_PENDING
    })
  },

  down: (queryInterface, Sequelize) => {

    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
    return queryInterface.changeColumn('Documents', 'state_type', {
        //allowNull: false,
        type: Sequelize.ENUM("validated", "invalid", "pending"),
        defaultValue: "pending"
    });

  }
};
