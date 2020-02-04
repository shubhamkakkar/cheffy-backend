
'use strict';

const path = require('path');
const Sequelize = require('sequelize');
const debug = require('debug')('plate-repository');
const {sequelize,Favourites, OrderFrequency,OrderItem, ShippingAddress, Review, PlateReview, AggregateReview, Plates, User, Ingredient, PlateImage, KitchenImage, ReceiptImage, PlateCategory, DietCategory } = require('../models/index');
const Op = Sequelize.Op;
const regexpService = require(path.resolve('app/services/regexp'));
const plateConstants = require(path.resolve('app/constants/plates'));
const userConstants = require(path.resolve('app/constants/users'));
const shippingAddressConstants = require(path.resolve('app/constants/shipping-address'));
const appConfig = require(path.resolve('config/app'));
const repositoryHelpers = require('./helpers');

exports.createIngredient = async (data) => {
  try {
    const response = await Ingredient.bulkCreate(data);
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to save ingredient", error: e };
  }
}

exports.updateIngredient = async (data) => {
  try {
    const response = await Ingredient.bulkCreate(data, { updateOnDuplicate: ["name", "purchase_date"] });
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to update ingredient", error: e };
  }
}

exports.createPlateImage = async (data) => {
  try {
    const response = await PlateImage.bulkCreate(data);
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to save ingredient", error: e };
  }
}

exports.createKitchenImage = async (data) => {
  try {
    const response = await KitchenImage.bulkCreate(data);
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to save ingredient", error: e };
  }
}

exports.createReceiptImage = async (data) => {
  try {
    const response = await ReceiptImage.bulkCreate(data);
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to save ingredient", error: e };
  }
}

exports.getPlateById = async (id) => {
  return await Plates.findByPk(id);
};

exports.findPlate = async (data) => {
  try {
    const existPlate = await Plates.findByPk(data, {
      attributes: [ 'id', 'name', 'description', 'price', 'delivery_time', 'sell_count' ],
      include: [
        {
          model: PlateCategory,
          as: 'category',
          attributes: [ 'name', 'description', 'url' ]
        },
        {
          model: Ingredient,
          attributes: [ 'id', 'name', 'purchase_date' ]
        },
        {
          model: PlateImage,
          attributes: [ 'id', 'name', 'url' ]
        },
        {
          model: KitchenImage,
          attributes: [ 'id', 'name', 'url' ]
        },
        {
          model: ReceiptImage,
          attributes: [ 'id', 'name', 'url' ]
        },
        {
          model: User,
          as: 'chef'
        }
      ]
    });
    return existPlate;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to get Plate!", error: e };
  }
}

exports.getPlate = async ({req, plateId}) => {
  debug('getPlate');
  let plateSelectAttributes = plateConstants.selectFields;

  let { userNearQuery, plateHavingQuery, plateOrderByQuery } = exports._nearHelper({req});

  const queryOptions = {
    attributes: plateSelectAttributes,
    include: [
      {
        model: PlateCategory,
        as: 'category',
        attributes: [ 'name', 'description', 'url' ]
      },
      {
        model: Ingredient,
        attributes: [ 'name', 'purchase_date' ]
      },
      {
        model: PlateImage,
        attributes: [ 'name', 'url' ]
      },
      {
        model: KitchenImage,
        attributes: [ 'name', 'url' ]
      },
      {
        model: ReceiptImage,
        attributes: [ 'name', 'url' ]
      },
      {
        model: Review,
        attributes: [ 'id','comment','rating', 'createdAt' ],
        as:'reviews',
        include: [{
          model: User,
          attributes: ['id', 'name','email','imagePath'],
          as:'user'
        }]
      },
      {
        model: User,
        as: 'chef',
        attributes: userConstants.userSelectFields
      }

    ],
    //nested: true
  };

  if(userNearQuery) {
    queryOptions.attributes = [
      ...plateConstants.selectFields,
      ...userNearQuery
    ];

    queryOptions.having = plateHavingQuery;
  }

  const existPlate = await Plates.findByPk(plateId, queryOptions);
  return repositoryHelpers.deliveryPriceHelper(existPlate);

}


exports.getPlateReviewByPlateId = async (data,limit) => {

  if(!data.page){
    data.page = 1;
  }

  if(!data.pageSize){
    data.pageSize=10
  }
  if (data.page == 1) {
    try {
      // const existPlates = await PlateReview.findAll({
      //     where: {
      //       plateId:parseInt(data.id)
      //     },
      //     include: [{
      //       model: User,
      //       required: true,
      //       as: 'user'}],
      //     limit: parseInt(data.pageSize)
      //   });
        let sql = `select u.name, pr.* from Reviews pr
        inner join Users u on pr.userId = u.id
          where pr.plateId = ${data.id} `;

        if(limit){
          sql = sql + `limit=${limit}`;
        }

        let existPlates = await sequelize.query(sql);

        return existPlates;
      } catch (e) {
        console.log("Error: ", e);
        return { message: "Fail to get Plate Reviews!", error: e };
      }
  }

  try {
    let skiper = data.pageSize * (data.page - 1)
    const Reviews = await Review.findAll({
        where: {
          palteId:plate
        },
        offset: parseInt(skiper),
        limit: parseInt(data.pageSize),
      });
      return Reviews;
    } catch (e) {
      console.log("Error: ", e);
      return { message: "Fail to get Plate Reviews!", error: e };
    }
}

exports.deletePlateImage = async (data) => {
  try {
    await PlateImage.destroy({
      where: { id: data }
    });
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail the plates", error: e }
  }
};

exports.deleteReceiptImage = async (data) => {
  try {
    await ReceiptImage.destroy({
      where: { id: data }
    });
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail the plates", error: e }
  }
};

exports.deleteKitchenImage = async (data) => {
  try {
    await KitchenImage.destroy({
      where: { id: data }
    });
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail the plates", error: e }
  }
};

exports.getPlateSearch = async (data) => {
  try {
    const response = await Plates.findAll({
      where: {
        name:{[Op.like]:'%'+data+'%'}
      },
      attributes: {
          exclude: ['UserId']
        },
    });
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail the plates", error: e }
  }
};

/**
* Query Helper for near plates
*/
exports._nearHelper = ({req}) => {

  let plateHavingQuery = {}

  let plateOrderByQuery = [['id', 'ASC']];

  let userNearQuery = null;
  debug('query', req.query);
  if((req.query.near && req.user) || (req.query.lat && req.query.lon)) {
    const currentUserLocationLat = req.query.lat || req.user.location_lat;
    const currentUserLocationLon = req.query.lon || req.user.location_lon;

    //calculation formula here https://martech.zone/calculate-distance/#ixzz2HZ6jkOVe
    //https://en.wikipedia.org/wiki/Great-circle_distance
    //default radius in miles
    const radiusDistance = req.query.radius || shippingAddressConstants.DEFAULT_RADIUS;
    const radiusDistanceUnit = req.query.radiusUnit || shippingAddressConstants.DISTANCE_MILES;
    const multiplier = shippingAddressConstants.radiusDistanceUnitHaversineMap[radiusDistanceUnit];
    debug('lat, lon, radius',currentUserLocationLat, currentUserLocationLon, radiusDistance);

    const roundDigit = 2;

    userNearQuery = [[sequelize.literal(`
      (SELECT round(${multiplier}*acos( cos( radians(${currentUserLocationLat}) ) * cos( radians( location_lat ) )
      * cos( radians( location_lon ) - radians(${currentUserLocationLon}) ) + sin( radians(${currentUserLocationLat}) ) * sin(radians(location_lat)) ),${roundDigit} )
      FROM Users where Users.id = Plates.userId)`), 'distance'],

      [sequelize.literal(`
        (SELECT round(${appConfig.delivery.unitPrice}*${multiplier}*acos( cos( radians(${currentUserLocationLat}) ) * cos( radians( location_lat ) )
        * cos( radians( location_lon ) - radians(${currentUserLocationLon}) ) + sin( radians(${currentUserLocationLat}) ) * sin(radians(location_lat)) ),${roundDigit})
        FROM Users where Users.id = Plates.userId)`), 'deliveryPriceEstimate']
    ];

    plateHavingQuery = {distance: {[Sequelize.Op.lte]: radiusDistance}};

    plateOrderByQuery = [[sequelize.col('distance'), 'ASC']];
  }

  return {userNearQuery: userNearQuery, plateHavingQuery, plateOrderByQuery};
}

/**
* Enhanced search filtering
*/
exports.searchPlates = async({req, query, pagination}) => {

  const whereQuery = {};

  debug('query',query);

  //exact field value queries
  if(query.keyword) {
    const keyword = regexpService.escape(query.keyword);
    whereQuery.name = {[Op.like]:`%${keyword}%`}
  }

  if(query.related) {
    whereQuery.id = {
      [Op.notIn]:[parseInt(query.related)]
    }
  }

  if(query.userId) {
    whereQuery.userId = query.userId;
  }

  if(query.price) {
    whereQuery.price = query.price;
  }

  if(query.delivery_time) {
    whereQuery.delivery_time = query.delivery_time;
  }

  if(query.delivery_type) {
    whereQuery.delivery_type = query.delivery_type;
  }

  if(query.plateAvailable) {
    whereQuery.available = query.plateAvailable;
  }

  if(query.chefDeliveryAvailable) {
    whereQuery.chefDeliveryAvailable = query.chefDeliveryAvailable;
  }

  if(query.categoryId) {
    whereQuery.categoryId = query.categoryId;
  }

  //filter queries
  //'sort','priceRange','deliveryPrice','dietary'
  let plateSelectAttributes = plateConstants.selectFields;
  let {userNearQuery, plateHavingQuery, plateOrderByQuery } = exports._nearHelper({req});


  const sortCategoryMaps = {
    0: 'default',
    1: 'popular',
    2: 'rating',
    3: 'deliveryTime'
  }

  if(query.sortCategory) {
    const sortType = sortCategoryMaps[query.sortCategory];

    if(sortType === 'deliveryTime') {
      plateOrderByQuery = [['deliveryTime', 'ASC']];
    }
  }

  if(query.deliveryPrice) {
    const deliveryPrice = Number(query.deliveryPrice);

    plateHavingQuery.deliveryPriceEstimate = {
      [Op.between]: [(deliveryPrice-0.25*deliveryPrice), (deliveryPrice+0.25*deliveryPrice)]
    };

  }

  if(query.priceRange && Array.isArray(query.priceRange)) {
    whereQuery.price = {
      [Op.between]: query.priceRange
    }
  }

  const priceRangeCategoryValueMaps = {
    1: 'low',
    2: 'medium',
    3: 'expensive'
  };

  let priceType = null;
  let priceTypeSubQuery = null;
  debug('query.priceRangeCategory', query.priceRangeCategory);

  if(query.priceRangeCategory && !Array.isArray(query.priceRangeCategory)) {
    priceType = priceRangeCategoryValueMaps[query.priceRangeCategory];

    //cheapest first
    if(priceType === 'low') {
      plateOrderByQuery = [['price', 'ASC']];
    }

    if(priceType === 'medium') {
      //plateHavingQuery = {distance: {[Sequelize.Op.lte]: radiusDistance}};
      priceTypeSubQuery = [sequelize.literal(`(SELECT avg(price) from Plates)`), 'avgPrice'];

      plateHavingQuery.price = {
        [Op.between]: [sequelize.literal(`(avgPrice-0.15*avgPrice)`), sequelize.literal(`(avgPrice+0.15*avgPrice)`)]
      }

      plateOrderByQuery = [['price', 'ASC']];

    }
    console.log('price type', priceType)
    //expensive first
    if(priceType === 'expensive') {

      plateOrderByQuery = [['price', 'DESC']];
    }

  }

  if(req.query.sort) {
    let sortType = req.query.sortType || 'DESC';
    if(['ASC', 'DESC'].indexOf(sortType) === -1) {
      throw new Error('Invalid sortType. Should be one of ASC | DESC');
    }
    if(userNearQuery) {
      plateOrderByQuery.push([req.query.sort, sortType])
    } else {
      plateOrderByQuery = [[req.query.sort, sortType]];
    }
  }

  let dietWhereQUery = {};

  if(query.dietary) {
    dietWhereQUery.name = query.dietary;
  }

  const queryOptions = {
     where: whereQuery,
     attributes: [
       ...plateConstants.selectFields,
     ],
     having: plateHavingQuery,
     order: plateOrderByQuery,
     include : [
       {
         model: User,
         as: 'chef',
         attributes: userConstants.userSelectFields
       },
       {
         model: PlateCategory,
         as: 'category',
         attributes: [ 'id', 'name', 'description', 'url' ]
       },
       {
         model: DietCategory,
         where: dietWhereQUery,
         required: false
         //through: {
         //
         //}
       },
       {
         model: Ingredient,
         attributes: [ 'id', 'name', 'purchase_date' ]
       },
       {
         model: PlateImage,
         attributes: [ 'id', 'name', 'url' ]
       },
       {
         model: KitchenImage,
         attributes: [ 'id', 'name', 'url' ]
       },
       {
         model: AggregateReview,
       },
       {
         model: ReceiptImage,
         attributes: [ 'id', 'name', 'url' ]
       },
       {
        model: Review,
        attributes: [ 'id','comment','rating', 'createdAt' ],
        as:'reviews',
        include: [{
          model: User,
          attributes: ['id', 'name','email','imagePath'],
          as:'user'
        }]
      },
       //todo include aggregate reviews for search not review list
     ],
     ...pagination,
  }
  debug('priceType', priceType);

  if(userNearQuery) {
    queryOptions.attributes = [
      ...plateConstants.selectFields,
      ...userNearQuery,
    ]
  }

  if(priceType === 'medium') {
    queryOptions.attributes.push(
      priceTypeSubQuery
    );
  }
  debug('queryOptions',queryOptions)

  const response = await Plates.findAll(queryOptions);
  return response;

};



exports.popularPlates = async (data) => {
  try {
    let list = OrderFrequency.findAll({
      attributes:[],
      include: [
      {
        model: Plates,
        as: 'plate_1',
        attributes: [ 'id', 'name', 'description', 'price', 'delivery_time', 'chefDeliveryAvailable', 'userId']
      },
      {
        model: Plates,
        as: 'plate_2',
        attributes: [ 'id', 'name', 'description', 'price', 'delivery_time', 'chefDeliveryAvailable', 'userId']
      }],
      order: [
      ['frequency', 'DESC']
      ]

    })

    return list;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail the plates", error: e }
  }
};

exports.checkFavourite = async (plateId, userId) => {

  try {
    let list = Favourites.findAll({
      where:{
          [Op.and]: [{userId:userId}, {plateId: plateId }]
      }

    })

    return list;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail the plates", error: e }
  }
};