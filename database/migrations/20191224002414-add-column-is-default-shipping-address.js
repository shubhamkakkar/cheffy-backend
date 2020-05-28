'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('ShippingAddresses', 'isDefaultAddress', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('ShippingAddresses', 'isDefaultAddress');
  }
};
