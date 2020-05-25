const path = require("path");
const Sequelize = require("sequelize");
const debug = require("debug")("driver-repository");
const {
  sequelize,
  ShippingAddress,
  Review,
  User,
  AggregateReview,
} = require(path.resolve("app/models/index"));
const Op = Sequelize.Op;
const regexpService = require(path.resolve("app/services/regexp"));
const userConstants = require(path.resolve("app/constants/users"));
const shippingAddressConstants = require(path.resolve(
  "app/constants/shipping-address"
));
const appConfig = require(path.resolve("config/app"));
const repositoryHelpers = require("./helpers");

const { DriverFinder } = require("../models/index");
const { getModelSQLTypesQuery } = require("../../helpers/model-type");

/**
 * Query Helper for near drivers
 */
exports._nearHelper = ({ req, pagination }) => {
  const currentUserLocationLat = req.query.lat || req.user.location_lat;
  const currentUserLocationLon = req.query.lon || req.user.location_lon;

  //calculation formula here https://martech.zone/calculate-distance/#ixzz2HZ6jkOVe
  //https://en.wikipedia.org/wiki/Great-circle_distance
  //default radius in miles
  const radiusDistance =
    req.query.radius || shippingAddressConstants.DEFAULT_RADIUS;
  const radiusDistanceUnit =
    req.query.radiusUnit || shippingAddressConstants.DISTANCE_MILES;
  const multiplier =
    shippingAddressConstants.radiusDistanceUnitHaversineMap[radiusDistanceUnit];
  debug(
    "lat, lon, radius",
    currentUserLocationLat,
    currentUserLocationLon,
    radiusDistance
  );

  const roundDigit = 2;

  /*const userNearQuery = `
    SELECT ${userConstants.userSelectFields.join(',')}, round(${multiplier}*acos( cos( radians(${currentUserLocationLat}) ) * cos( radians( location_lat ) )
    * cos( radians( location_lon ) - radians(${currentUserLocationLon}) ) + sin( radians(${currentUserLocationLat}) ) * sin(radians(location_lat)) ),${roundDigit} )
    as distance FROM Users where user_type='driver' having distance <= ${radiusDistance} order by distance LIMIT ${pagination.limit} OFFSET ${pagination.offset}`;*/

  const userNearQuery = [
    [
      sequelize.literal(`(round(${multiplier} * acos( cos( radians(${currentUserLocationLat}) ) * cos( radians( location_lat ) )
      * cos( radians( location_lon ) - radians(${currentUserLocationLon}) ) + sin( radians(${currentUserLocationLat}) ) * sin(radians(location_lat))),${roundDigit}))
      `),
      "distance",
    ],
  ];

  const havingQuery = { distance: { [Sequelize.Op.lte]: radiusDistance } };

  const orderByQuery = [[sequelize.col("distance"), "ASC"]];

  return { userNearQuery, havingQuery, orderByQuery };
};

exports.getMyNearDrivers = async ({ req, pagination }) => {
  const whereQuery = { user_type: "driver" };
  let { userNearQuery, havingQuery, orderByQuery } = exports._nearHelper({
    req,
    pagination,
  });

  //const response = await sequelize.query(userNearQUery, { type: sequelize.QueryTypes.SELECT });

  const queryOptions = {
    where: whereQuery,
    attributes: [...userConstants.userSelectFields, ...userNearQuery],
    include: [
      {
        model: AggregateReview,
      },
    ],
    having: havingQuery,
    order: orderByQuery,
    ...pagination,
  };

  const response = await User.findAll(queryOptions);
  return response;
};

exports.getModelType = async (option) => {
  let res = "";
  if (option === "driverFinders") {
    res = await getModelSQLTypesQuery("DriverFinders");
  }
  return res;
};
