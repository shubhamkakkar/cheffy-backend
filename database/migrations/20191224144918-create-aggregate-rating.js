'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('AggregateReviews', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      review_type: {
        type: Sequelize.ENUM('chef','plate','driver'),
      },
      
      plateId: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: {
          model: "Plates",
          key: "id"
        }
      },
      
      
      chefID: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      driverID: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      userCount: {
      type: Sequelize.INTEGER
    },
      rating: Sequelize.DOUBLE,

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
    return queryInterface.dropTable('AggregateReviews');
  }
};