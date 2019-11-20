'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('ShippingAddresses', [
      {
        id: 994,
        addressLine1: "Rua Santa Maria",
        addressLine2: "Qd.09 Lt.09",
        city: "Goiás",
        state: "GO",
        zipCode: "76600000",
        lat: "-15.9374015",
        lon: "-50.1516464",
        userId: 15,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      },
      {
        id: 995,
        addressLine1: "Rua Santa Mônica",
        addressLine2: "Qd.04 Lt.03",
        city: "Goiás",
        state: "GO",
        zipCode: "76600000",
        lat: "-15.9374015",
        lon: "-50.1516464",
        userId: 16,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
    ], {})
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('ShippingAddresses', null, {});
  }
};
