'use strict';
const faker = require('faker');
const path = require('path');
const { generateHash } = require(path.resolve('helpers/password'));

module.exports = {
  up: async (queryInterface, Sequelize) => {

    let password = await generateHash('12345678');

    const userData = ['james', 'adam', 'chris', 'newton', 'foodie', 'abin' ,'dipesh', 'nipun', 'job', 'jimmy'].map((name, index) => {
      let user = {
        id: 1000 + index,
        name: name,
        email: name + '@gmail.com',
        phone_no: faker.phone.phoneNumber(),
        country_code: faker.address.countryCode(),
        user_type: 'user',
        verification_email_status: 'verified',
        verification_email_token: null,
        verification_phone_status: 'verified',
        verification_phone_token: null,
        password: password,
        imagePath: faker.image.imageUrl(300, 300, 'people', undefined, true),
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };
      return user;
    });

    return queryInterface.bulkInsert('Users', userData, {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', null, {});
  }
};
