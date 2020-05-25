'use strict';

const faker = require('faker');
const helpers = require('../helpers');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const ingredients = [];
    for(let i=1000; i<= 1080; i++) {
      ingredients.push({
        plateId: i,
        name: 'fruit- ' + i,
        purchase_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      });
    }

    for(let j=2000; j<= 2016; j++) {
      ingredients.push({
        plateId: j,
        name: 'maida - ' + j,
        purchase_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      });
    }

    /*for(let l=3000; l<= 3015; l++) {
      ingredients.push({
        plateId: l,
        name: 'flour - ' + l,
        purchase_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      });
    }*/

    for(let k=4000; k<= 4004; k++) {
      ingredients.push({
        plateId: k,
        name: 'chicken - ' + k,
        purchase_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      });
    }

    return queryInterface.bulkInsert('Ingredients', ingredients, {});
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.bulkDelete('Ingredients', null, {});
  }
};
