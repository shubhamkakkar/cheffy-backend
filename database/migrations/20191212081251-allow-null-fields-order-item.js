'use strict';

module.exports = {
  up:async (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
  
    await queryInterface.addColumn('OrderItems', 'plate_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Plates',
        key: 'id'
      }
    });

    return queryInterface.addColumn('OrderItems', 'customPlateId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'CustomPlateOrders',
        key: 'id'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
    await queryInterface.removeColumn('OrderItems', 'plate_id');
    await queryInterface.removeColumn('OrderItems', 'customPlateId');

    await queryInterface.addColumn('OrderItems', 'plate_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'Plates',
        key: 'id'
      }
    });

    return queryInterface.addColumn('OrderItems', 'customPlateId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'CustomPlateOrders',
        key: 'id'
      }
    });

  }
};
