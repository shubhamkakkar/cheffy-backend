'use strict';
const { CustomPlate, CustomPlateAuction, CustomPlateAuctionBid, CustomPlateOrder, CustomPlateImage, User } = require("../models/index");
const { getModelSQLTypesQuery } = require('../../helpers/model-type');
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

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

exports.getPlate = async (data) => {
  const plate = await CustomPlate.findByPk(data ,{
     include : [
       {
         model: CustomPlateAuction,
         attributes: [ 'id', 'state_type', 'winner', 'createdAt' ],
         include: [
           {
             model: CustomPlateAuctionBid,
             attributes: [ 'id', 'chefID', 'price', 'preparation_time', 'createdAt' ]
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
  bid = JSON.stringify(bid);
  bid = JSON.parse(bid);
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
    attributes: [ 'id', 'CustomPlateAuctionID', 'chefID', 'price', 'preparation_time' ],
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
  bid = JSON.stringify(bid);
  bid = JSON.parse(bid);
  let plate_data = {
    name: bid.custom_plates_id.custom_plates.name,
    description: bid.custom_plates_id.custom_plates.description,
    quantity: bid.custom_plates_id.custom_plates.quantity,
    price: bid.price,
    userId: bid.chefID,
    preparation_time: bid.preparation_time,
  }
  return plate_data;
}

exports.getModelType = async () => {
  // const res = await getModelSQLTypes(User);
  const res = await getModelSQLTypesQuery('CustomPlates');
  return res;
}
