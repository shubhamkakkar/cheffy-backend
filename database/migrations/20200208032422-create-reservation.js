'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Reservation', {
      id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
      },
      
      foodName: Sequelize.STRING,
      description: Sequelize.STRING,
      photo: Sequelize.STRING,
      chefRange: Sequelize.INTEGER,
      quantity: Sequelize.INTEGER,
      allDay: Sequelize.BOOLEAN,
      deliveryTime:Sequelize.STRING,
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        }
      },      
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Reservation');
  }
};