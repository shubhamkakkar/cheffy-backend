'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Reviews', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id"
        }
      },
      plateId: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: {
          model: "Plates",
          key: "id"
        }
      },
      orderId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Orders",
          key: "id"
        }
      },       
      orderItemId: {
        type: Sequelize.INTEGER,
        references: {
          model: "OrderItems",
          key: "id"
        }
      }, 
      rating: {
        type: Sequelize.DOUBLE
      },
      comment: {
        type: Sequelize.STRING
      },
      review_type: {
      type: Sequelize.ENUM('chef','plate','driver'),
    },
    chefID: {
      type: Sequelize.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    driverID: {
      type: Sequelize.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
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
    return queryInterface.dropTable('Reviews');
  }
};