'use strict';

const faker = require('faker');
const helpers = require('../helpers');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const plateDietCategories = [];
    for(let i=1000; i<= 1080; i++) {
      plateDietCategories.push({
        plateId: i,
        dietCategoryId: 1000,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      });
    }

    for(let h=1000; h<= 1080; h++) {
      plateDietCategories.push({
        plateId: h,
        dietCategoryId: 1001,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      });
    }

    for(let j=2000; j<= 2016; j++) {
      plateDietCategories.push({
        plateId: j,
        dietCategoryId: 1003,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      });
    }

    /*for(let l=3000; l<= 3015; l++) {
      plateDietCategories.push({
        plateId: l,
        dietCategoryId: 1003,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      });
    }*/

    for(let k=4000; k<= 4004; k++) {
      plateDietCategories.push({
        plateId: k,
        dietCategoryId: 1002,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      });
    }

    return queryInterface.bulkInsert('PlateDietCategories', plateDietCategories, {});
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.bulkDelete('PlateDietCategories', null, {});
  }
};
