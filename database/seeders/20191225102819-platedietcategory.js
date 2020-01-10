'use strict';

const faker = require('faker');
const helpers = require('../helpers');

function getRandomUser() {
  return helpers.getRandomInt(1000, 1009);
}

function getRandomPlate() {
  return helpers.getRandomInt(1000, 1009);
}
function getDietCategory() {
  return helpers.getRandomInt(1000, 1003);
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const plateDietCategories = [1000, 1001, 1002, 1003].map((dietCategoryId, index) => {
      return  {
      	plateId: getRandomPlate(),
        dietCategoryId: dietCategoryId,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
    });

    return queryInterface.bulkInsert('PlateDietCategories', plateDietCategories, {});
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.bulkDelete('PlateDietCategories', null, {});
  }
};
