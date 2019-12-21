'use strict';
const path = require('path');
const { Basket, BasketItem, Plates, CustomPlate, CustomPlateOrder, User, ShippingAddress } = require('../models/index');
const userConstants = require(path.resolve('app/constants/users'));

exports.getOrCreateUserBasket = async (userId) => {
  const basket = await Basket.findOrCreate({
    defaults: {
      userId: userId
    },
    where: { userId: userId }
  });
  return basket;
}

exports.getOneUserBasket = async (userId) => {
  const basket = await Basket.findOne({ where: { userId: userId } });
  return basket;
}

/**
* get plate from baske-item
* there will be only one unique plate in the basket
*/
exports.getBasketItemsPlate = async (basketId, plateId) => {
  const basket = await BasketItem.findOne({ where: { basketId: basketId, plateId: plateId } });
  return basket;
}


exports.getBasketItemsCustom = async (data, id) => {
  const basket = await BasketItem.findAll({ where: { basketId: data, customPlateId: id } });
  return basket;
}


exports.getBasketItems = async (basketId) => {
  const basketItems = await BasketItem.findAll({ where: { basketId: basketId} });
  return basketItems;
}

/**
* Get basketItem by id
*/
exports.getSingleBasketItem = async (basketItemId) => {
  const basketItem = await BasketItem.findByPk(basketItemId);
  return basketItem;
}


/**
* Destory BasketItem
* basketItem -> instance
*/
exports.deleteBasketItem = async (basketItem) => {
  return await basketItem.destroy();
}

/**
* Remove basket items related to basketId
*/
exports.removeBasketItems = async (basketId) => {
  return await BasketItem.destroy({where: {basketId: basketId}});
}

/**
* subtract 1 quantity from basketItem
* basketItem -> instance
*/
exports.subtractBasketItem = async (basketItem) => {
  const item = await basketItem.decrement('quantity', {by: 1});
  if (item.quantity > 0 ) {
    return item;
  }

  await item.destroy();

  return {
    message: "Item removed from cart!",
    error: false
  };
}

/**
* add 1 quantity to basketItem
* basketItem -> instance
*/
exports.addBasketItem = async (basketItem) => {
  return await basketItem.increment('quantity', {by: 1});
}
/*
duplicate definition
exports.getBasketItems = async (data, quant) => {
  let basket = await BasketItem.findByPk(data);
  let ammount = quant || 1;
  basket.quantity = parseInt(basket.quantity + ammount)
  await basket.save();
  return basket;
}
*/
exports.createBasketItem = async (data) => {
  try {
    const basket = await BasketItem.create({...data});
    return basket;
  } catch (e) {
    console.log(e)
  }
}

exports.delBasketItem = async (data) => {
  try {
    const basket = await BasketItem.destroy({
      where: { id: data }
    });
    return basket;
  } catch (e) {
    console.log(e)
  }
}

//deprecated
//use getBasketItemsDetail
exports.listBasket = async (data) => {

  let existBasket = await Basket.findByPk(data, {
    attributes: [ ],
    include: [
      {
        model: BasketItem,
        attributes: [ 'id', 'quantity', 'plateId', 'customPlateId', 'basket_type' ],
        include: [
          {
            model: Plates,
            as: 'plate',
            attributes: [ 'id', 'name', 'description', 'price', 'delivery_time', 'userId' ]
          },
          //added custom plate in listBasket as well
          {
            model: CustomPlateOrder,
            as: 'custom_plate',
            attributes: [ 'id', 'name', 'description', 'userId', 'price' ]
          }
        ],
      }
    ],
  });

}

exports.listBasketCustom = async (data) => {
  try {
    let existBasket = await Basket.findByPk(data, {
      attributes: [ ],
      include: [
        {
          model: BasketItem,
          attributes: [ 'id', 'quantity' ],
          include: [
            {
              model: CustomPlateOrder,
              as: 'custom_plate',
              attributes: [ 'id', 'name', 'description', 'userId', 'price' ]
            }
          ],
        }
      ]
    });
    return existBasket;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to get your Basket!", error: e };
  }
}


/**
* Get Basket Items in detail
* both plates and custom plate orders
*/
exports.getBasketItemsDetail = async (basketId) => {

  let existBasket = await BasketItem.findAll({
    where: { basketId: basketId },
    attributes: [ 'id', 'quantity', 'plateId', 'customPlateId', 'basket_type' ],
    include: [
      {
        model: Plates,
        as: 'plate',
        attributes: [ 'id', 'name', 'description', 'price', 'delivery_time', 'chefDeliveryAvailable', 'userId' ]
      },
      //added custom plate in listBasket as well
      //TODO may be we should name as custom_plate_order. it would be confused with the actual custom_plate table
      {
        model: CustomPlateOrder,
        as: 'custom_plate',
        attributes: [ 'id', 'name', 'description', 'price', 'userId', 'chefID', 'chefDeliveryAvailable'],
        include: [
          {
            model: User,
            as: 'chef',
            attributes: userConstants.userSelectFields,
            include: [
              {
                model: ShippingAddress,
                as: 'address'
              }
            ]
          }
        ]
      }
    ]
  });

  return existBasket;
}
