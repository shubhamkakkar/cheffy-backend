'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
    //await queryInterface.removeColumn('ShippingAddresses', 'deliveryNote');

    return queryInterface.addColumn('ShippingAddresses', 'deliveryNote', {
      type: Sequelize.STRING,
      defaultValue: false
    });
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */

    return queryInterface.removeColumn('ShippingAddresses', 'deliveryNote');
  }
};
