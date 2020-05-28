'use strict';
const path = require('path');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('Users', 'location_lat', {
        type:Sequelize.DECIMAL(10,8),
        allowNull: true
    }),queryInterface.changeColumn('Users', 'location_lon', {
        type:Sequelize.DECIMAL(11,8),
        allowNull: true
    })]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('Users', 'location_lat', {
        type:Sequelize.DECIMAL(10,8),
        allowNull: true
    }),queryInterface.changeColumn('Users', 'location_lon', {
        type:Sequelize.DECIMAL(10,8),
        allowNull: true
    })]);
  }
};
