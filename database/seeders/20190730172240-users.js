'use strict';

const { generateHash } = require('../../helpers/password');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    let password = await generateHash('12345678');
    return queryInterface.bulkInsert('Users', [
      {
        id: 15,
        name: "Demo Username 1",
      	email: "demo-1@cheffy.com",
      	user_type: "user",
        password: password,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      },
      {
        id: 16,
        name: "Demo Username 2",
      	email: "demo-2@cheffy.com",
        user_type: "chef",
	      restaurant_name: "Restaurant's name",
        password: password,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
  ], {});
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.bulkDelete('Users', null, {});
  }
};
