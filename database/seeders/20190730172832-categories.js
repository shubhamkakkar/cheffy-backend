'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('PlateCategories', [
      {
        name: "Mexican Food",
      	description: "Pork-Tacos-with-Mango-Salsa",
      	url: "https://www.tasteofhome.com/wp-content/uploads/2018/01/Pork-Tacos-with-Mango-Salsa_EXPS_SDDJ17_198169_B08_11_3b-696x696.jpg",
      },
      {
        name: "Indian Food",
      	description: "FotoJetcoverindianrest",
      	url: "https://assets.traveltriangle.com/blog/wp-content/uploads/2018/02/FotoJetcoverindianrest.jpg",
      },
      {
        name: "Judaism Food",
      	description: "Montreal-smoked-meat-main",
      	url: "https://www.myjewishlearning.com/wp-content/uploads/2017/06/Montreal-smoked-meat-main.jpg",
      },
  ], {});
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.bulkDelete('PlateCategories', null, {});
  }
};
