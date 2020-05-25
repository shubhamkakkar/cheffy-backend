'use strict';
const italianFoodList = require('../italian-food-list');
const faker = require('faker');
const helpers = require('../helpers');

const chefIds = [2000, 2001, 2002, 2003, 2004];

function getRandomChef() {
  return chefIds[helpers.getRandomInt(0, 2)];
}

const deliveryTypes = ['free', 'paid'];
function getRandomDeliveryType() {
  return deliveryTypes[helpers.getRandomInt(0, 1)];
}

const rating = [0,1,2,3,4,5];
function getRandomRating() {
  return rating[helpers.getRandomInt(0, 5)];
}


module.exports = {
  up: async  (queryInterface, Sequelize) => {
    const plates = italianFoodList.data.map((name, index) => {
      return  {
        id: 3000 + index,
      	name: name,
      	description: faker.lorem.sentence(),
      	price: faker.commerce.price(),
      	delivery_time: faker.random.number(),
        sell_count: faker.random.number(),
        delivery_type: getRandomDeliveryType(),
        //fixed from chef list
        userId: 2004,
        available: faker.random.boolean(),
        chefDeliveryAvailable: faker.random.boolean(),
        rating: getRandomRating(),
        //categoryId is fixed from categorylist
        categoryId: 1002,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
    });

    return queryInterface.bulkInsert('Plates', plates, {});
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.bulkDelete('Plates', null, {});
  }
};
