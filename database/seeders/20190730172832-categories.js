'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('PlateCategories', [
      {
        name: "Takos Food",
      	description: "takos",
        url: "https://www.tasteofhome.com/wp-content/uploads/2018/01/Pork-Tacos-with-Mango-Salsa_EXPS_SDDJ17_198169_B08_11_3b-696x696.jpg",
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      },
      {
        name: "Indian Food",
      	description: "indian-food",
        url: "https://assets.traveltriangle.com/blog/wp-content/uploads/2018/02/FotoJetcoverindianrest.jpg",
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      },
      {
        name: "Brazilian Food",
      	description: "brazilian-food",
        url: "https://www.myjewishlearning.com/wp-content/uploads/2017/06/Montreal-smoked-meat-main.jpg",
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      },
  ], {});
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.bulkDelete('PlateCategories', null, {});
  }
};
