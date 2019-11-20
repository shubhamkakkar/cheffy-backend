'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('BasketItems', [
      {
        id: 900,
        plateId: 990,
        quantity: 1,
        basketId: 995,
        customPlateId: null,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      },
      {
        id: 901,
        plateId: 999,
        quantity: 1,
        basketId: 996,
        customPlateId: null,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
    ], {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('BasketItems', null, {});
  }
};
