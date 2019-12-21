'use strict';
const path = require('path');
const { CustomPlate, CustomPlateAuction, CustomPlateAuctionBid, CustomPlateOrder, CustomPlateImage, User } = require("../models/index");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const userConstants = require(path.resolve('app/constants/users'));

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


exports.chefGetPlates = async () => {
  const plate = await CustomPlate.findAll({
     where: {
       close_date: {
         [Op.gte]: new Date()
       }
     },
     include : [
       {
         model: CustomPlateAuction,
         attributes: [ 'id', 'state_type', 'winner', 'createdAt' ],
         where: {
           state_type: 'open'
         },
         include: [
           {
             model: CustomPlateAuctionBid,
             attributes: [ 'id', 'chefID', 'price', 'createdAt' ]
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

/**
* My Custom Plates
* With auction information, bid count
*/
exports.myCustomPlates = async ({userId, pagination}) => {

  const customPlates = await CustomPlate.findAll({
     where: {
       close_date: {
         [Op.gte]: new Date()
       }
     },
     include : [
       {
         model: CustomPlateAuction,
         attributes: [
           'id', 'state_type', 'winner', 'createdAt',
         [Sequelize.literal('(SELECT COUNT(*) FROM CustomPlateAuctionBids WHERE CustomPlateAuctionBids.CustomPlateAuctionID = CustomPlateAuction.id)'), 'bidCount'] ],
         where: {
           state_type: 'open'
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
  const plate = await CustomPlate.findByPk(data ,{
     include : [
       {
         model: CustomPlateAuction,
         attributes: [ 'id', 'state_type', 'winner', 'createdAt' ],
         include: [
           {
             model: CustomPlateAuctionBid,
             attributes: [ 'id', 'chefID', 'price', 'preparation_time', 'createdAt', 'chefDeliveryAvailable', 'delivery_time', 'winner' ],
             include: [
               {
                 model: User,
                 as: 'Chef',
                 attributes: userConstants.userSelectFields
               }
             ]
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
    attributes: [ 'id', 'CustomPlateAuctionID', 'chefID', 'price', 'preparation_time', 'chefDeliveryAvailable' ],
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


  if(!bid) return null;

  /*bid = JSON.stringify(bid);
  bid = JSON.parse(bid);*/
  //TODO we should keep the repository clean and do the hydration stuff in the controller,
  //so this can be used in multiple places

  bid = bid.get({plain: true});

  let plate_data = {
    name: bid.custom_plates_id.custom_plates.name,
    description: bid.custom_plates_id.custom_plates.description,
    quantity: bid.custom_plates_id.custom_plates.quantity,
    auctionId: bid.custom_plates_id.id,
    price: bid.price,
    chefID: bid.chefID,
    preparation_time: bid.preparation_time,
    chefDeliveryAvailable: bid.chefDeliveryAvailable,
    custom_plate: bid.custom_plates_id.custom_plates
  };

  return plate_data;
}
