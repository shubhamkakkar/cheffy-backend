
'use strict';
const Sequelize = require('sequelize');
const {CustomPlate, CustomPlateImage,Favourites, sequelize,OrderItem, ShippingAddress,Review, Plates, User, Ingredient, PlateImage, KitchenImage, ReceiptImage, PlateCategory } = require('../models/index');
const Op = Sequelize.Op;


exports.add = async (user,custom,plate,fav_type) => {
  try {

  	let full_data = {};
  	full_data.userId = user;
  	full_data.plateId = plate;
  	full_data.CustomplateId = custom;
  	full_data.fav_type = fav_type;
  	console.log(full_data)
    const response = await Favourites.create({ ...full_data });
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to add favourite", error: e };
  }
}

exports.delete = async (id, user) => {
  await Favourites.destroy({ 
    where: {[Op.and]: [{userId:user}, {id: id }]}
  });
}

exports.findPlateinFav = async (data, userId) => {
  const existPlate = await Favourites.findOne({ 
    where: {[Op.and]: [{userId:userId}, {plateId: data }]}
  });
  return existPlate;
}

exports.findCustomPlateinFav = async (data, userId) => {
  const existPlate = await Favourites.findOne({ where: {
    [Op.and]: [{userId:userId}, {CustomplateId: data }]
 } });
  return existPlate;
}

exports.getUserFavourites = async (data) => {
  const favourites = await Favourites.findAll({
    where:{userId:data},
    include: [
    {
      model: Plates,
      include: [{
        model: PlateImage,
        attributes: ['id', 'url'],
      }],
      attributes:{
        exclude:['UserId']
      }
    },

    {
      model: CustomPlate,
      as:'custom_plates' ,
      include: [{
        model: CustomPlateImage,
        attributes: ['id', 'url'],
      }],
      attributes:{
        exclude:['UserId']
      }
    },
    ]

  });
  return favourites;
}
