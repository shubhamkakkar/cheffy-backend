'use strict';
const path = require('path');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('Users','verification_code', 'password_reset_token');
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('Users','password_reset_token', 'verification_code');
  }
};
