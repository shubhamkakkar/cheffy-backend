'use strict';
const { Basket, BasketItem, Plates, CustomPlate, CustomPlateOrder } = require('../models/index');

exports.getUserBasket = async (data) => {
  const basket = await Basket.findOrCreate({
    defaults: {
      userId: data
    },
    where: { userId: data }
  });
  return basket;
}

exports.getOneUserBasket = async (data) => {
  const basket = await Basket.findOne({ where: { userId: data } });
  return basket;
}

exports.getBasketItens = async (data, id) => {
  const basket = await BasketItem.findAll({ where: { basketId: data, plateId: id } });
  return basket;
}

exports.getBasketItensCustom = async (data, id) => {
  const basket = await BasketItem.findAll({ where: { basketId: data, customPlateId: id } });
  return basket;
}

exports.getBasketItens = async (basketId) => {
  const basketItems = await BasketItem.findAll({ where: { basketId: basketId} });
  return basketItems;
}

exports.deleteBasketItem = async (data, id) => {
  const basket = await BasketItem.destroy({ where: { id: data } });
  return basket;
}

exports.subtractBasketItem = async (data) => {
  let basket = await BasketItem.findByPk(data);
  basket.quantity = parseInt(basket.quantity - 1)
  console.log("Resultado: ", basket.quantity)
  if (basket.quantity > 0 ) {
    await basket.save();
    return basket;
  }
  await BasketItem.destroy({ where: { id: data } });
  return {
    message: "Item removed from cart!",
    error: false
  };
}

exports.addBasketItem = async (data) => {
  let basket = await BasketItem.findByPk(data);
  basket.quantity = parseInt(basket.quantity + 1)
  await basket.save();
  return basket;
}

exports.addBasketItens = async (data, quant) => {
  let basket = await BasketItem.findByPk(data);
  let ammount = quant || 1;
  basket.quantity = parseInt(basket.quantity + ammount)
  await basket.save();
  return basket;
}

exports.createBasketItem = async (data) => {
  try {
    const basket = await BasketItem.create({...data});
    return basket;
  } catch (e) {
    console.log(e)
  }
}

exports.listBasket = async (data) => {
  try {
    let existBasket = await Basket.findByPk(data, {
      attributes: [ ],
      include: [
        {
          model: BasketItem,
          attributes: [ 'id', 'quantity', 'plateId' ],
          include: [
            {
              model: Plates,
              as: 'plate',
              attributes: [ 'id', 'name', 'description', 'price', 'delivery_time', 'userId' ]
            }
          ],
        }
      ],
    });
    return existBasket;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to get your Basket!", error: e };
  }
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
