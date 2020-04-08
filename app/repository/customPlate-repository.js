'use strict';
const path = require('path');
const { sequelize, CustomPlate, CustomPlateAuction, CustomPlateAuctionBid, CustomPlateOrder, CustomPlateImage, User, CustomPlateAuctionReject, CustomPlateBidReject } = require("../models/index");
const Sequelize = require("sequelize");
const debug = require('debug')('customPlate-repository');
const Op = Sequelize.Op;
const userConstants = require(path.resolve('app/constants/users'));
const customPlateConstants = require(path.resolve('app/constants/custom-plates'));
const regexpService = require(path.resolve('app/services/regexp'));
const shippingAddressConstants = require(path.resolve('app/constants/shipping-address'));
const repositoryHelpers = require('./helpers');


exports.create = async (data) => {
  let plate = await CustomPlate.create({ ...data });
  return plate;
}

exports.createCustomOrder = async (data) => {
  let plate = await CustomPlateOrder.create({ ...data });
  return plate;
}

exports.createAuction = async (data) => {
  let plate = await CustomPlateAuction.create({ ...data });
  return plate;
}

exports.getCustomPlate = async(customPlateId) => {
  return await CustomPlate.findByPk(customPlateId);
}

exports.getCustomPlateImage = async(customPlateImageId) => {
  return await CustomPlateImage.findByPk(customPlateImageId);
}

exports.getCustomPlateAuction = async(auctionId) => {
  return await CustomPlateAuction.findByPk(auctionId);
}

exports.getCustomPlateAuctionByCustomPlate = async(customPlateId) => {
  return await CustomPlateAuction.findOne({where: {CustomPlateID: customPlateId}});
}
exports.hasChefBiddedAuction = async(auctionId, chefId) => {
  console.log(auctionId);
  console.log(chefId);
  return await CustomPlateAuctionBid.findOne({where: 
    {
      CustomPlateAuctionID: auctionId,
      chefID: chefId
    },
    attributes:['id']
  });
}

exports.hasChefRejectedAuction = async(auctionId, chefId) => {
  return await CustomPlateAuctionReject.findOne({where: 
    {
       CustomPlateAuctionID: auctionId,
       chefID: chefId
    },
  attributes:['id']
  });
}

/**
* Searches for user custom plates by chef with various filters
*/
exports.chefGetPlates = async ({req, query, pagination}) => {
  const whereQuery = {};

  const auctionWhereQuery = {};

  let customPlateHavingQuery = {};

  let customPlateOrderByQuery = [['id', 'ASC']];

  if(query.active) {
    whereQuery.close_date = {
      [Op.gte]: new Date()
    };
  }

  if(query.keyword) {
    const keyword = regexpService.escape(query.keyword);
    whereQuery.name = {[Op.like]:`%${keyword}%`}
  }

  let customPlateSelectAttributes = customPlateConstants.selectFields;
  let userNearQuery = null;
  if((query.near && req.user) || (req.query.lat && req.query.lon)) {
    const currentUserLocationLat = req.query.lat || req.user.location_lat;
    const currentUserLocationLon = req.query.lon || req.user.location_lon;

    //calculation formula here https://martech.zone/calculate-distance/#ixzz2HZ6jkOVe
    //https://en.wikipedia.org/wiki/Great-circle_distance
    //default radius in miles
    const radiusDistance = req.query.radius || shippingAddressConstants.DEFAULT_RADIUS;
    const radiusDistanceUnit = req.query.radiusUnit || shippingAddressConstants.DISTANCE_MILES;
    const multiplier = shippingAddressConstants.radiusDistanceUnitHaversineMap[radiusDistanceUnit];
    debug('lat, lon, radius',currentUserLocationLat, currentUserLocationLon, radiusDistance);

    userNearQuery = [sequelize.literal(`
      (SELECT (${multiplier}*acos( cos( radians(${currentUserLocationLat}) ) * cos( radians( location_lat ) )
      * cos( radians( location_lon ) - radians(${currentUserLocationLon}) ) + sin( radians(${currentUserLocationLat}) ) * sin(radians(location_lat)) ) )
      FROM Users where Users.id = CustomPlate.userId)`), 'distance'];

    customPlateHavingQuery = {distance: {[Sequelize.Op.lte]: radiusDistance}};

    customPlateOrderByQuery = [[sequelize.col('distance'), 'ASC']];
  }
  const CustomPlateAuctionRejects =  await CustomPlateBidReject.findAll({
    attributes: ["CustomPlateAuctionBidId"],
    group: ["CustomPlateAuctionBidId"]
  });
   const CustomPlateAuctionRejectedBidIds = CustomPlateAuctionRejects.map(CustomPlateAuctionReject => CustomPlateAuctionReject.CustomPlateAuctionBidId);


  if(query.state_type) {
    auctionWhereQuery.state_type = query.state_type;
  }

  if(query.userId) {
    whereQuery.userId = query.userId;
  }

  if(query.price_min) {
    whereQuery.price_min = query.price_min;
  }

  if(query.quantity) {
    whereQuery.quantity = query.quantity;
  }

  if(query.price_max) {
    whereQuery.price_max = query.price_max;
  }

  const queryOptions = {
     where: whereQuery,
     attributes: [
       ...customPlateConstants.selectFields,
     ],
     having: customPlateHavingQuery,
     order: customPlateOrderByQuery,
     include : [
       {
         model: User,
         as: 'user',
         attributes: userConstants.userSelectFields
       },
       {
         model: CustomPlateAuction,
         attributes: [ 'id', 'state_type', 'winner', 'createdAt' ],
         where: auctionWhereQuery,
         include: [
           {
             model: CustomPlateAuctionBid,
             attributes: [ 'id', 'chefID', 'price', 'preparation_time', 'delivery_time', 'chefDeliveryAvailable', 'winner', 'createdAt' ],
              where: {
               id: {
                [Op.notIn]:CustomPlateAuctionRejectedBidIds
             }
            },
            required:false 
           }
         ],
       },
       {
         model: CustomPlateImage,
         attributes: [ 'id', 'name', 'url', 'createdAt' ]
       }
     ],
     ...pagination,
     //raw: true
  }

  if(userNearQuery) {
    queryOptions.attributes = [
      ...customPlateConstants.selectFields,
      userNearQuery
    ]
  }

  const customPlates = await CustomPlate.findAll(queryOptions);

  return repositoryHelpers.deliveryPriceHelperList(customPlates);
}

/**
* My Custom Plates
* With auction information, bid count
*/
exports.myCustomPlates = async ({userId, pagination}) => {

  const customPlates = await CustomPlate.findAll({
     where: {
       [Op.and]: [{userId:userId},{close_date: {[Op.gte]: new Date()}}]
     },
     include : [
       {
         model: CustomPlateAuction,
         attributes: [
           'id', 'state_type', 'winner', 'createdAt',
         [Sequelize.literal('(SELECT COUNT(*) FROM CustomPlateAuctionBids WHERE CustomPlateAuctionBids.CustomPlateAuctionID = CustomPlateAuction.id AND id NOT IN (SELECT CustomPlateAuctionBidId FROM CustomPlateBidRejects))'), 'bidCount'] ],
         where: {
           state_type: 'open',
         },
       },
       {
         model: CustomPlateImage,
         attributes: [ 'id', 'name', 'url', 'createdAt' ]
       }
     ]
  });

  return customPlates;
}

/**
* Get custom plate by id
* Get Auction information
* Get bid list with detail information of chef
*/
exports.getPlate = async (data) => {
  const CustomPlateAuctionRejects =  await CustomPlateBidReject.findAll({
    attributes: ["CustomPlateAuctionBidId"],
    group: ["CustomPlateAuctionBidId"]
  });
   const CustomPlateAuctionRejectedBidIds = CustomPlateAuctionRejects.map(CustomPlateAuctionReject => CustomPlateAuctionReject.CustomPlateAuctionBidId);

  const plate = await CustomPlate.findByPk(data ,{
     include : [
       {
         model: CustomPlateAuction,
         attributes: [ 'id', 'state_type', 'winner', 'createdAt' ],
         include: [
           {
             model: CustomPlateAuctionBid,
             attributes: [ 'id', 'chefID', 'price', 'preparation_time', 'createdAt', 'chefDeliveryAvailable', 'delivery_time', 'winner', 'deletedAt' ],
             include: [
               {
                 model: User,
                 as: 'Chef',
                 attributes: userConstants.userSelectFields
               }
             ],
             where: {
              id: {
               [Op.notIn]:CustomPlateAuctionRejectedBidIds
            }
          },
            required: false,
             paranoid: false
           }
         ],
       },
       {
         model: CustomPlateImage,
         attributes: [ 'id', 'name', 'url', 'createdAt' ]
       }
     ]
  });
  return plate;
}

exports.createPlateImage = async (data) => {
  try {
    const response = await CustomPlateImage.bulkCreate(data);
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to save images", error: e };
  }
}

exports.bidCustomPlate = async (data) => {
  let plate = await CustomPlateAuctionBid.create({ ...data });
  return plate;
}

exports.rejectAuctionOfACustomPlate = async (data) => {
  let plate = await CustomPlateAuctionReject.create({ ...data });
  return plate;
}

exports.rejectAuctionBidOfACustomPlate = async (data) => {
  let auctionBid = await CustomPlateBidReject.create({ ...data });
  return auctionBid;
}
exports.updateCustomPlateBidById = async ({id, data}) => {
  return await CustomPlateAuctionBid.update({...data}, {where: {id: id}});
}

exports.acceptCustomPlateBid = async (data) => {
  let bid = await CustomPlateAuctionBid.findByPk(data, {
    attributes: [ 'id', 'CustomPlateAuctionID', 'chefID', 'price' ],
    include : [
      {
        model: CustomPlateAuction,
        as: 'custom_plates_id',
        attributes: [ 'id', 'state_type', 'winner', 'createdAt' ],
        include: [
          {
            model: CustomPlate,
            as: 'custom_plates',
            attributes: [ 'id', 'name', 'description', 'price_min', 'price_max', 'quantity', 'close_date' ]
          }
        ]
      }
    ]
  });

  bid.winner = true;
  await bid.save();

  /*bid = JSON.stringify(bid);
  bid = JSON.parse(bid);*/
  //https://stackoverflow.com/questions/21961818/sequelize-convert-entity-to-plain-object
  //https://sequelize.org/master/manual/instances.html#values-of-an-instance
  bid = bid.get({plain: true});

  bid.plate = bid.custom_plates_id.custom_plates;
  delete bid.custom_plates_id.custom_plates;
  bid.plate_auction = bid.custom_plates_id;
  delete bid.custom_plates_id;
  let change_auction = await CustomPlateAuction.findByPk(bid.plate_auction.id);
  change_auction.winner = true;
  change_auction.state_type = 'closed';
  await change_auction.save();
  return bid;
}


exports.getCustomPlateBid = async (data) => {
  let bid = await CustomPlateAuctionBid.findByPk(data, {
    attributes: [ 'id', 'CustomPlateAuctionID', 'chefID', 'price', 'preparation_time', 'chefDeliveryAvailable', 'winner', 'deletedAt'],
    include : [
      {
        model: CustomPlateAuction,
        as: 'custom_plates_id',
        attributes: [ 'id', 'state_type', 'winner', 'userId','createdAt' ],
        include: [
          {
            model: CustomPlate,
            as: 'custom_plates',
            attributes: [ 'id', 'name', 'description', 'price_min', 'price_max', 'quantity', 'close_date' ]
          }
        ]
      }
    ]
  });


  if(!bid) return null;

  /*bid = JSON.stringify(bid);
  bid = JSON.parse(bid);*/
  //TODO we should keep the repository clean and do the hydration stuff in the controller,
  //so this can be used in multiple places

  bid = bid.get({plain: true});

  let plate_data = {
    id: bid.id,
    name: bid.custom_plates_id.custom_plates.name,
    description: bid.custom_plates_id.custom_plates.description,
    quantity: bid.custom_plates_id.custom_plates.quantity,
    auctionId: bid.custom_plates_id.id,
    price: bid.price,
    chefID: bid.chefID,
    preparation_time: bid.preparation_time,
    chefDeliveryAvailable: bid.chefDeliveryAvailable,
    custom_plate: bid.custom_plates_id.custom_plates,
    winner: bid.winner,
    userId: bid.custom_plates_id.userId
  };

  return plate_data;
}

exports.deleteCustomAuctionBid = async (data) => {
  try{
  return await CustomPlateAuctionBid.destroy({
    where: {
      id: data,
      winner:false
    }
  });
}catch(e){
  console.log(e);
}
}
