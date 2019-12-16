'use strict';
const path = require('path');
const HttpStatus = require('http-status-codes');
const { User } = require('../models/index');
const ValidationContract = require('../services/validator');
const repository = require('../repository/basket-repository');
const md5 = require('md5');
const authService = require('../services/auth');
const asyncHandler = require('express-async-handler');
const basketConstants = require(path.resolve('app/constants/baskets'));
const debug = require('debug')('basket');


/**
* Method: POST
* req body: plateId, quantity
* Add plate to user basket
* create new BasketItems if no plate exists
* update quantity of BasketItems if plate exists in basket
*/
exports.addItem = asyncHandler(async (req, res, next) => {

  let contract = new ValidationContract();
  contract.isRequired(req.body.plateId, 'The plate identifier code is required!');
  contract.isRequired(req.body.quantity, 'Quantity field is required!');

  if (!contract.isValid()) {
    return res.status(HttpStatus.CONFLICT).send(contract.errors());
  }

  //get user basket. create on if it doesn't exists yet.
  let basket = await repository.getOrCreateUserBasket(req.userId);

  let basket_item_plate = await repository.getBasketItemsPlate(basket[0].id, req.body.plateId)

  let item;
  //if no plate is found in basket item, add it to basket item.
  if (!basket_item_plate) {
    let body = { plateId: req.body.plateId, quantity: req.body.quantity, basketId: basket[0].id }
    item = await repository.createBasketItem(body);
  } else {
    item = await basket_item_plate.increment('quantity', {by: req.body.quantity});
  }
  //after finished updating or adding plate to basket item, get the basket list
  //calculate price and send as response
  let basketItemsListDetail = await repository.getBasketItemsDetail(basket[0].id);

  const result = prepareCartResponse({basketItems: basketItemsListDetail, basket: basket});

  res.status(HttpStatus.ACCEPTED).send(result);
});


/**
* Method: GET
* List BasketItems of a user
* Both plate and customPlate can be listed at once
* send basketItemId as well in the response. it is required to change the quantity of plates/customPlate
*/
exports.list = asyncHandler(async (req, res, next) => {

  let basket = await repository.getOrCreateUserBasket(req.userId)
  let basketItemsListDetail = await repository.getBasketItemsDetail(basket[0].id);

  const result = prepareCartResponse({basketItems: basketItemsListDetail, basket: basket[0]});

  res.status(HttpStatus.ACCEPTED).send(result);
});


/**
* Method: PUT
* req params: basketItemId
* Subtract 1 quantity from specific basket item
* Both plate and customPlate can be subtracted
*/
exports.subtractItem = asyncHandler(async ( req, res, next) => {

  let basket = await repository.getOneUserBasket(req.userId)
  let basketItem = await repository.getSingleBasketItem(req.params.basketItemId);

  if (!basketItem) {
    return res.status(HttpStatus.CONFLICT).send({
      message: "We didn't find this plate/item in the cart!",
      error: true
    });
  }

  if (basketItem.quantity >= 1){
    await repository.subtractBasketItem(basketItem)
  } else {
    await repository.deleteBasketItem(basketItem)
  }

  //TODO why creating basket again?
  //calling this api infers, there's already a user basket
  //basket = await repository.getOrCreateUserBasket(req.userId);

  let basketItemsListDetail = await repository.getBasketItemsDetail(basket.id);

  const result = prepareCartResponse({basketItems: basketItemsListDetail, basket: basket});
  res.status(HttpStatus.ACCEPTED).send(result);
});

/**
* Method: DELTE
* req params: basketItemId
* Delete plate/custom-plate by basketItemId
*/
exports.deleteItem = asyncHandler(async ( req, res, next) => {

  let basket = await repository.getOneUserBasket(req.userId)
  let basketItem = await repository.getSingleBasketItem(req.params.basketItemId);

  if (!basketItem) {
    return res.status(HttpStatus.CONFLICT).send({
      message: "We didn't find this plate/item in the cart!",
      error: true
    });
  }

  await repository.deleteBasketItem(basketItem);

  //TODO why creating basket again?
  //calling this api infers, there's already a user basket
  //basket = await repository.getOrCreateUserBasket(req.userId);

  let basketItemsListDetail = await repository.getBasketItemsDetail(basket.id);

  const result = prepareCartResponse({basketItems: basketItemsListDetail, basket: basket});
  res.status(HttpStatus.ACCEPTED).send(result);
});

/**
* Method: PUT
* req params: basketItemId
* Add 1 quantity to specific basket item
* Both plate and customPlate can be added
*/
exports.sumItem = asyncHandler(async ( req, res, next) => {

  let basket = await repository.getOneUserBasket(req.userId);
  let basketItem = await repository.getSingleBasketItem(req.params.basketItemId);

  if (!basketItem) {
    return res.status(HttpStatus.CONFLICT).send({
      message: "We didn't find this plate in the cart!",
      error: true
    });
  }

  await repository.addBasketItem(basketItem);

  //TODO why creating basket again?
  //calling this api infers, there's already a user basket
  //basket = await repository.getOrCreateUserBasket(req.userId)

  let basketItemsListDetail = await repository.getBasketItemsDetail(basket.id);

  const result = prepareCartResponse({basketItems: basketItemsListDetail, basket: basket});

  res.status(HttpStatus.ACCEPTED).send(result);
});

/**
* Helper method
* Prepare cart response.
* response : {basket_total, basket_subtotal, basket_delivery_fee, basket_total_items}
*/
function prepareCartResponse({basketItems, basket}){
  let result = [];

  let basket_total = 0.0;
  let basket_subtotal = 0.0;
  let basket_delivery_fee = 0.0;
  let basket_total_items = 0.0;

  basketItems.forEach(function (value) {
    /*
    TODO
    commented this out. i didn't find any usage of this. if someone finds it please uncomment it.
    why is the items length checked
    if (value['dataValues'].items > 1) {
      value.quantity = value['dataValues'].items;
      value.total = parseFloat(parseFloat(value.quantity) * parseFloat(value[value.basket_type].price)).toFixed(2);
      return result.push({
        basketItemId: value.id,
        quantity: value.quantity,
        total_value: parseFloat(value.total),
        [value.basket_type]: value['dataValues'][value.basket_type]
      });

    }*/

    value.total = parseFloat(parseFloat(value.quantity) * parseFloat(value[value.basket_type].price)).toFixed(2);
    result.push({
      basketItemId: value.id,
      quantity: value.quantity,
      basket_type: value.basket_type,
      total_value: parseFloat(value.total),
      [value.basket_type]: value['dataValues'][value.basket_type]
    });

    basket_total_items = value.quantity;
    basket_subtotal += parseFloat(value.total);
    //TODO basket delivery fee
    basket_delivery_fee += 0;
    basket_total += (basket_delivery_fee + parseFloat(value.total));

  });

  let basket_return = {
    basketId: basket.id,
    sub_total: basket_subtotal,
    delivery_fee: basket_delivery_fee,
    total: basket_total,
    items: result
  }

  return basket_return;
}



exports.delItem = async ( req, res, next) => {
  const token_return = await authService.decodeToken(req.headers['x-access-token'])
  if (!token_return) {
    res.status(HttpStatus.CONFLICT).send({
      message: "You must be logged in to delete itens to cart",
      error: true
    });
  }
  let basket = await repository.getOneUserBasket(token_return.id)
  let basket_itens = await repository.getBasketItens(basket.id, req.params.id)
  if (basket_itens.length === 0) {
    res.status(HttpStatus.CONFLICT).send({
      message: "We didn't find this plate in the cart!",
      error: true
    });
    return 0;
  }
  await repository.delBasketItem(basket_itens[0].id)
  basket = await repository.getUserBasket(token_return.id)
  let basket_list = await repository.listBasket(basket[0].id)

  res.status(HttpStatus.ACCEPTED).send(basket_list);
}
