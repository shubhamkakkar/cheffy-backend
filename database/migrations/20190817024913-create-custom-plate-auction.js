'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('CustomPlateAuctions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      CustomPlateID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'CustomPlates',
          key: 'id'
        }
      },
      state_type: {
        allowNull: false,
        type: Sequelize.ENUM("open", "closed"),
        defaultValue: "open"
      },
      winner: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('CustomPlateAuctions');
  }
};
