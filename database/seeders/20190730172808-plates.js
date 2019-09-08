'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Plates', [
      {
      	name: "X-Eggs V1",
      	description: "i like that",
      	price: "9",
      	delivery_time: "22",
        userId: 18,
        categoryId: 2
      },
      {
      	name: "X-Bacon V2",
      	description: "i like so much",
      	price: "12",
      	delivery_time: "22",
        userId: 18,
        categoryId: 1
      }
  ], {});
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.bulkDelete('Plates', null, {});
  }
};
