'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Message', [
      {
        from_userid: 13124,
        to_userid: 324532,
        message: 'When you will be available to work on the new plates?',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        from_userid: 43534,
        to_userid: 34534,
        message: 'This plate is delivered today?',
        createdAt: new Date(),
        updatedAt: new Date()
      }
  ], {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Message', null, {});
  }
};
