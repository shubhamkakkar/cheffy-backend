'use strict';
const faker = require('faker');

const users = [1000, 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009];
const chefs = [2000, 2001, 2002, 2003, 2004];
const drivers = [3000, 3001, 3002, 3003, 3004];

module.exports = {
  up: async  (queryInterface, Sequelize) => {
    const documents = users.concat(chefs).concat(drivers).map((userId) => {
      return {
        comment: faker.lorem.words(),
        state_type: 'approved',
        social_security_number: faker.finance.account(),
        userId: userId,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };
    });

    return queryInterface.bulkInsert('Documents', documents, {})
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Documents', null, {});
  }
};
