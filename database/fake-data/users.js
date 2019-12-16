
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



const statusTypes = userConstants.STATUS_TYPES;
function getRandomVerificationStatus(bool) {
  return statusTypes[helpers.getRandomInt(0, statusTypes.length-1)];
}

const userTypes = userConstants.USER_TYPES;

function getRandomUserType() {
  return userTypes[helpers.getRandomInt(0, userTypes.length-1)]
}

async function buildModel() {
  let password = await generateHash('12345678');
  let fakeUser = {
    name: faker.name.findName(),
    email: faker.internet.email(),
    phone_no: faker.phone.phoneNumber(),
    country_code: faker.address.countryCode(),
    user_type: getRandomUserType(),
    verification_email_status: getRandomVerificationStatus(),
    verification_email_token: faker.random.number(),
    verification_phone_status: getRandomVerificationStatus(),
    verification_phone_token: faker.random.number(),
    password: password,
    imagePath: faker.image.imageUrl(300, 300, 'people', undefined, true)
  };

  return fakeUser;
}

async function init({}) {
  return await bulkSave({Model: User, buildModel: buildModel, total: 100});
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
