'use strict';

const faker = require('faker');
const helpers = require('../helpers');

function getRandomUser() {
  return helpers.getRandomInt(1000, 1009);
}


module.exports = {
  up: async (queryInterface, Sequelize) => {
    const categories = ['Vegetarian','Vegan','gluten-free','halal'].map((name, index) => {
      return  {
        id: 1000 + index,
      	name: name,
      	description: name,
        userId: getRandomUser(),
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
    });

    return queryInterface.bulkInsert('DietCategories', categories, {});
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.bulkDelete('DietCategories', null, {});
  }
};
