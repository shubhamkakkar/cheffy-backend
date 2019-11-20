'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('KitchenImages', [{
      id: 999,
      name: 'Takos',
      url: 'kitchen-plate01.jpg',
      plateId: 999,
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
    },
    {
      id: 990,
      name: 'Salad',
      url: 'kitchen-plate02.jpg',
      plateId: 990,
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
    }
  ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('KitchenImages', null, {});
  }
};
