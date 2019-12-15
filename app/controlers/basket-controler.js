'use strict';
var HttpStatus = require('http-status-codes');
const { User } = require('../models/index');
const ValidationContract = require('../services/validator');
const repository = require('../repository/basket-repository');
const md5 = require('md5');
const authService = require('../services/auth');

exports.addItem = async (req, res, next) => {
  try {
    const token_return = await authService.decodeToken(req.headers['x-access-token'])
    if (!token_return) {
      res.status(HttpStatus.CONFLICT).send({
        message: "You must be logged in to add items to cart",
        error: true
      });
    }

    let contract = new ValidationContract();
    contract.isRequired(req.body.plateId, 'The plate identifier code is required!');
    contract.isRequired(req.body.quantity, 'Quantity field is required!');

    if (!contract.isValid()) {
      res.status(HttpStatus.CONFLICT).send({ message: contract.errors(), status: HttpStatus.NON_AUTHORITATIVE_INFORMATION });
      return 0;
    }

    let basket = await repository.getUserBasket(token_return.id)
    let basket_itens = await repository.getBasketItens(basket[0].id, req.body.plateId)
    let item;
    if (basket_itens.length === 0) {
      let body = { plateId: req.body.plateId, quantity: req.body.quantity, basketId: basket[0].id }
      item = await repository.createBasketItem(body);
    } else {
      await repository.addBasketItens(basket_itens[0].id, req.body.quantity)
      let basket = await repository.getUserBasket(token_return.id)
      item = await repository.listBasket(basket[0].id)
    }

    basket = await repository.getUserBasket(token_return.id)
    let basket_list = await repository.listBasket(basket[0].id)
    let arrayNew = []
    basket_list.BasketItems.forEach(function (value) {
      if (value['dataValues'].itens > 1) {
        value.quantity = value['dataValues'].itens;
        value.total = parseFloat(parseFloat(value.quantity) * parseFloat(value.plate.price)).toFixed(2);
        arrayNew.push({
          quantity: value.quantity,
          total_value: parseFloat(value.total),
          plate: value['dataValues'].plate
        })
      } else {
        value.total = parseFloat(parseFloat(value.quantity) * parseFloat(value.plate.price)).toFixed(2);
        arrayNew.push({
          quantity: value.quantity,
          total_value: parseFloat(value.total),
          plate: value['dataValues'].plate
        })
      }
    });
    res.status(HttpStatus.ACCEPTED).send(arrayNew);

  } catch (e) {
    console.log("Error: ", e)
    res.status(HttpStatus.CONFLICT).send({
      message: "You must be logged in to remove itens to cart",
      error: e
    });
  }
}



exports.list = async (req, res, next) => {
  const token_return = await authService.decodeToken(req.headers['x-access-token'])
  if (!token_return) {
    res.status(HttpStatus.CONFLICT).send({
      message: "You must be logged in to add items to cart",
      error: true
    });
  }
  let basket = await repository.getUserBasket(token_return.id)

  let basket_list = await repository.listBasket(basket[0].id)

  let basket_list_custom = await repository.listBasketCustom(basket[0].id)

  let arrayNew = []
  let chefId = "";
  let basket_total = 0.0;
  let basket_subtotal = 0.0;
  let basket_delivery_fee = 0.0;
  let basket_total_items = 0.0;


  basket_list.BasketItems.forEach(function (value) {

    if(value.plate!=undefined){

    if (value['dataValues'].itens > 1) {
      value.quantity = value['dataValues'].itens;
      value.total = parseFloat(parseFloat(value.quantity) * parseFloat(value.plate.price)).toFixed(2);

      arrayNew.push({
        quantity: value.quantity,
        total_value: parseFloat(value.total),
        plate: value['dataValues'].plate
      })
    } else {
      value.total = parseFloat(parseFloat(value.quantity) * parseFloat(value.plate.price)).toFixed(2);

      arrayNew.push({
        quantity: value.quantity,
        total_value: parseFloat(value.total),
        plate: value['dataValues'].plate
      })
    }

    basket_total_items = value.quantity;
    basket_subtotal += parseFloat(value.total);
    basket_delivery_fee += 0;
    basket_total += (basket_delivery_fee + parseFloat(value.total));

    }
  });


  basket_list_custom.BasketItems.forEach(function (value) {

    if(value.custom_plate!=undefined){

    if (value['dataValues'].itens > 1) {
      value.quantity = value['dataValues'].itens;
      value.total = parseFloat(parseFloat(value.quantity) * parseFloat(value.custom_plate.price)).toFixed(2);

      arrayNew.push({
        quantity: value.quantity,
        total_value: parseFloat(value.total),
        custom_plate: value['dataValues'].custom_plate
      })
    } else {
      value.total = parseFloat(parseFloat(value.quantity) * parseFloat(value.custom_plate.price)).toFixed(2);

      arrayNew.push({
        quantity: value.quantity,
        total_value: parseFloat(value.total),
        custom_plate: value['dataValues'].custom_plate
      })
    }

    basket_total_items = value.quantity;
    basket_subtotal += parseFloat(value.total);
    basket_delivery_fee += 0;
    basket_total += (basket_delivery_fee + parseFloat(value.total));

    }
  });

  if(arrayNew[0].plate.userId != undefined){
    chefId = arrayNew[0].plate.userId;

  }
  else if(arrayNew[0].custom_plate.userId != undefined){
    chefId = arrayNew[0].custom_plate.userId;

  }


  let basket_return = {
    id: basket[0].id,
    chefId:chefId,
    sub_total: basket_subtotal,
    delivery_fee: basket_delivery_fee,
    total: basket_total,
    items: arrayNew
  }


  res.status(HttpStatus.ACCEPTED).send(basket_return);
}

exports.subtractIten = async ( req, res, next) => {
  const token_return = await authService.decodeToken(req.headers['x-access-token'])
  if (!token_return) {
    res.status(HttpStatus.CONFLICT).send({
      message: "You must be logged in to add items to cart",
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

  if (basket_itens[0].quantity >= 1){
    await repository.subtractBasketItem(basket_itens[0].id)
  } else {
    await repository.deleteBasketItem(basket_itens[0].id)
  }

  basket = await repository.getUserBasket(token_return.id)
  let basket_list = await repository.listBasket(basket[0].id)
  let arrayNew = []
  basket_list.BasketItems.forEach(function (value) {
    if (value['dataValues'].itens > 1) {
      value.quantity = value['dataValues'].itens;
      value.total = parseFloat(parseFloat(value.quantity) * parseFloat(value.plate.price)).toFixed(2);
      arrayNew.push({
        quantity: value.quantity,
        total_value: parseFloat(value.total),
        plate: value['dataValues'].plate
      })
    } else {
      value.total = parseFloat(parseFloat(value.quantity) * parseFloat(value.plate.price)).toFixed(2);
      arrayNew.push({
        quantity: value.quantity,
        total_value: parseFloat(value.total),
        plate: value['dataValues'].plate
      })
    }
  });

  res.status(HttpStatus.ACCEPTED).send(arrayNew);
}

exports.sumIten = async ( req, res, next) => {
  const token_return = await authService.decodeToken(req.headers['x-access-token'])
  if (!token_return) {
    res.status(HttpStatus.CONFLICT).send({
      message: "You must be logged in to add itens to cart",
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
  await repository.addBasketItem(basket_itens[0].id)
  basket = await repository.getUserBasket(token_return.id)
  let basket_list = await repository.listBasket(basket[0].id)
  let arrayNew = []
  basket_list.BasketItems.forEach(function (value) {
    if (value['dataValues'].itens > 1) {
      value.quantity = value['dataValues'].itens;
      value.total = parseFloat(parseFloat(value.quantity) * parseFloat(value.plate.price)).toFixed(2);
      arrayNew.push({
        quantity: value.quantity,
        total_value: parseFloat(value.total),
        plate: value['dataValues'].plate
      })
    } else {
      value.total = parseFloat(parseFloat(value.quantity) * parseFloat(value.plate.price)).toFixed(2);
      arrayNew.push({
        quantity: value.quantity,
        total_value: parseFloat(value.total),
        plate: value['dataValues'].plate
      })
    }
  });
  res.status(HttpStatus.ACCEPTED).send(arrayNew);
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