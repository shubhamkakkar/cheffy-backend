'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Orders', [
      {
        id: 997,
        basketId: 995,
        userId: 15,
        shippingId: 995,
        state_type: 5,
        total_itens: 1,
        shipping_fee: 2.50,
        order_total: 14,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      },
      {
        id: 998,
        basketId: 996,
        userId: 15,
        shippingId: 995,
        state_type: 5,
        total_itens: 1,
        shipping_fee: 2.50,
        order_total: 14,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
    ], {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Orders', null, {});
  }
};
