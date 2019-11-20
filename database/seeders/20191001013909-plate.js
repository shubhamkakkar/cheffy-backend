'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Plates', [
      {
        id: 999,
      	name: "Takos",
      	description: "Mexican food",
      	price: "9",
      	delivery_time: "22",
        userId: 16,
        categoryId: 2,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      },
      {
        id: 990,
      	name: "Salad",
      	description: "Common salad",
      	price: "12",
      	delivery_time: "22",
        userId: 16,
        categoryId: 1,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
  ], {});
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.bulkDelete('Plates', null, {});
  }
};
