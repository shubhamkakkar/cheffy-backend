
require("dotenv").config({
    path: '.env'
});

const path = require('path');
const util = require('util');
const faker = require('faker');
const ProgressBar = require('progress');
const Sequelize = require('sequelize');
const { sequelize, User, Wallet, OrderItem, ShippingAddress, Plates, Documents } = require(path.resolve('app/models/index'));
const currentUserLocationLat = faker.address.latitude();
const currentUserLocationLon = faker.address.longitude();
const radiusDistance = 10;

console.log('lat lon radius', currentUserLocationLat, currentUserLocationLon, radiusDistance);

async function nearPlates({}) {

  //near user cordinates in miles
  const nearCalculation = () => {
    //return `(((acos(sin(({${currentUserLocationLat}}*pi()/180))*sin(('location_lat'*pi()/180))+cos((${currentUserLocationLat}*pi()/180))*cos(('location_lon'*pi()/180)) * cos(((${currentUserLocationLon}-'location_lon')*pi()/180))))*180/pi())*60*1.1515)`;
  };

  return await Plates.findAll({
    attributes: [
      'id', 'name', 'price',
      [sequelize.literal(`(select AVG(price) from Plates)`), 'avgPrice']
    ],
    /*having: {
      price: {
        [Sequelize.Op.lte]: sequelize.col('avgPrice')
      }
    },*/
    include: [
      {
        model: User,
        as: 'chef',
        attributes: [
          'name',
          'email',
          'imagePath',
          [sequelize.literal(`(SELECT (((acos(sin((${currentUserLocationLat}*pi()/180))*sin(("location_lat"*pi()/180))+cos((${currentUserLocationLat}*pi()/180))*cos(("location_lon"*pi()/180)) * cos(((${currentUserLocationLon}-"location_lon")*pi()/180))))*180/pi())*60*1.1515) from Users where Plates.userId =  Users.id)`), 'distance']
        ],
        having: {
          distance: {
            [Sequelize.Op.lte]: radiusDistance
          }
        }
      },
    ]

  });
  /*return await sequelize.query(`
    SELECT p.id, p.name as plate, u.name as chef, u.location_lat as lat, u.location_lon as lon
    from Plates as p
    inner join Users as u on p.userId=u.id
    and u.location_lat <= ${(parseFloat(currentUserLocationLat) + radiusDistance)}
    and u.location_lat >= ${(parseFloat(currentUserLocationLat) - radiusDistance)}
    and u.location_lon <= ${(parseFloat(currentUserLocationLon) + radiusDistance)}
    and u.location_lon >= ${(parseFloat(currentUserLocationLon) - radiusDistance)}
    limit 10;
  `);*/

}

async function executeQuery() {
  return await nearPlates({});
}

executeQuery().then((result) => {
  console.log(result);

  process.exit(0);
}).catch((err) => {
  console.log(err);
  process.exit(1);
  console.log("couldn't connect to database");
});
