'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Users', [
      {
        name: "Filipe Machado",
      	email: "filipwx7@gmail.com",
      	user_type: "user",
      	password: "12345678"
      },
      {
        name: "Filipe Machado Carneiro",
      	email: "filipwx8@gmail.com",
        user_type: "chef",
	      restaurant_name: "Filip's Cookies",
      	password: "12345678"
      }
  ], {});
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.bulkDelete('Users', null, {});
  }
};
