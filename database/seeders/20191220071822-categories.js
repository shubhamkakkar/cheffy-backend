'use strict';

const faker = require('faker');
const helpers = require('../helpers');

function getRandomUser() {
  return helpers.getRandomInt(1000, 1009);
}


module.exports = {
  up: async (queryInterface, Sequelize) => {
    const categories = ['Fruit Salad', 'Nepalese', 'Italian', 'American'].map((name, index) => {
      return  {
        id: 1000 + index,
      	name: name,
      	description: name,
        url: faker.image.food(),
        userId: getRandomUser(),
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
    });

    return queryInterface.bulkInsert('PlateCategories', categories, {});
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.bulkDelete('PlateCategories', null, {});
  }
};
