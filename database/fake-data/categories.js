
require("dotenv").config({
    path: '.env'
});

const path = require('path');
const util = require('util');
const faker = require('faker');
const ProgressBar = require('progress');
const argv = require('yargs').argv;
const bulkSave = require('./bulk-save');
const helpers = require('./helpers');
const { generateHash } = require(path.resolve('helpers/password'));
const userConstants = require(path.resolve('app/constants/users'));
const { User, Wallet, OrderItem, ShippingAddress, Plates, Documents } = require(path.resolve('app/models/index'));


async function buildModel() {
  let password = await generateHash('12345678');
  let fakeCategory = {
    name: faker.name.findName(),
    description: faker.lorem.sentence()
    url: faker.image.imageUrl(300, 300, 'people', undefined, true)
  };

  return fakeUser;
}

async function init({}) {
  return await bulkSave({Model: User, buildModel: buildModel, total: 10000});
}

async function executeTasks() {
  return await init({});
}

executeTasks().then((result) => {
  console.log('done');
  process.exit(0);
}).catch((err) => {
  console.log(err);
  process.exit(1);
  console.log("couldn't connect to database");
});
