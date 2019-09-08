'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      email: {
        allowNull: false,
        type: Sequelize.STRING,
        unique: true,
      },
      password: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      country_code: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      phone_no: {
        allowNull: true,
        type: Sequelize.STRING,
        unique: true,
      },
      location_lat: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      location_lon: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      user_type: {
        allowNull: false,
        type: Sequelize.ENUM('user', 'chef', 'admin', 'driver'),
      },
      imagePath: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      auth_token: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      restaurant_name: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      verification_code: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      verification_email_token: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      verification_email_status: {
        allowNull: true,
        type: Sequelize.ENUM('pending', 'verified'),
        defaultValue: "pending"
      },
      verification_phone_token: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      verification_phone_status: {
        allowNull: true,
        type: Sequelize.ENUM('pending', 'verified'),
        defaultValue: "pending"
      },
      status: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      user_ip: {
        allowNull: true,
        type: Sequelize.STRING,
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
    return queryInterface.dropTable('Users');
  }
};
