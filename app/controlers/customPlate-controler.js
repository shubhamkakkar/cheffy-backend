'use strict';
var HttpStatus = require('http-status-codes');
const ValidationContract = require('../services/validator');
const repository = require("../repository/customPlate-repository");
const repoBasket = require('../repository/basket-repository');
const repositoryOrderPayment = require("../repository/orderPayment-repository");
const repositoryShip = require("../repository/shipping-repository");
const repositoryCart = require('../repository/basket-repository');
const repositoryOrder = require("../repository/order-repository");
const authService = require('../services/auth');
const paymentService = require("../services/payment");
const helpers = require('./controler-helper');
const { User, CustomPlateOrder } = require('../models/index');
const TransactionsService = require("../services/transactions")

function addDays() {
  var result = new Date();
  result.setDate(result.getDate() + 1);
  return result;
}

exports.addCustomPlate = async (req, res, next) => {
  let contract = new ValidationContract();
  contract.hasMinLen(req.body.name, 3, 'The plate name should have more than 3 caracteres');
  contract.isRequired(req.body.description, 'Plate description is required!');
  contract.isRequired(req.body.price_min, 'Minimum price is required!');
  contract.isRequired(req.body.price_max  , 'The maximum price is required!');
  contract.isRequired(req.body.quantity, 'The amount of plates is obligatory!');
  if (!contract.isValid()) {
    res.status(HttpStatus.CONFLICT).send({ message: contract.errors(), status: HttpStatus.NON_AUTHORITATIVE_INFORMATION }).end();
    return 0;
  }

  const token_return = await authService.decodeToken(req.headers['x-access-token'])
  const existUser = await User.findOne({ where: { id: token_return.id } });

  if (existUser == null || existUser.user_type == 'chef' || existUser == undefined) {
    res.status(HttpStatus.CONFLICT).send({
      message: "There was a problem validating the data!",
      error: true
    });
    return 0;
  }

  let data_received = req.body;
  let images, images_create;
  data_received.userId = existUser.id;
  data_received.close_date = addDays();

  if (data_received.images) {
    images = data_received.images;
    delete data_received.images;
  }

  try {
    const retorno = await repository.create(data_received)
    if (images) {
      let images_data = []
      images.forEach(elem => {
        elem.CustomPlateID = retorno.id;
        images_data.push(elem);
      })
      images_create = await repository.createPlateImage(images_data)
    }
    const auction = await repository.createAuction({CustomPlateID: retorno.id});

    let payload = {};
    payload.status = HttpStatus.CREATED;
    payload.plate = retorno;
    payload.auction = auction;
    payload.images = images_create;

    res.status(HttpStatus.CREATED).send({
      message: "The custom plate was successfully added!",
      data: payload
    });
    return 0;
  } catch (e) {
    console.log("Error: ", e);
    res.status(HttpStatus.CONFLICT).send({
      message: "Failed to create a new plate!",
      error: true,
      data: e
    });
    return 0;
  }
}

exports.bidCustomPlate = async (req, res, next) => {
  const token_return = await authService.decodeToken(req.headers['x-access-token'])
  const existUser = await User.findOne({ where: { id: token_return.id } });
  if (existUser == null || existUser.user_type !== 'chef' || existUser == undefined) {
    res.status(HttpStatus.CONFLICT).send({
      message: "There was a problem validating the data!",
      error: true
    });
    return 0;
  }
  if (!req.body.auction) {
    res.status(HttpStatus.CONFLICT).send({
      message: "We couldn't find the Auction!",
      status: HttpStatus.CONFLICT
    });
    return 0;
  }
  if (!req.body.price) {
    res.status(HttpStatus.CONFLICT).send({
      message: "You need to give a price!",
      status: HttpStatus.CONFLICT
    });
    return 0;
  }
  if (!req.body.preparation_time) {
    res.status(HttpStatus.CONFLICT).send({
      message: "You need to estimate a preparation time!",
      status: HttpStatus.CONFLICT
    });
    return 0;
  }

  let context = {
    CustomPlateAuctionID: req.body.auction,
    chefID: existUser.id,
    price: req.body.price,
    preparation_time: req.body.preparation_time
  };
  try {
    const data = await repository.bidCustomPlate(context);

    res.status(HttpStatus.CREATED).send({
      message: "Your bid was registered!",
      data: data
    });
  } catch (e) {
    console.log("Error: ", e);
    res.status(HttpStatus.CONFLICT).send({
      message: "Failed to place your bid!",
      error: true,
      data: e
    });
    return 0;
  }
}

exports.acceptCustomPlateBid = async (req, res, next) => {
  let token_return
  try {
    token_return = await authService.decodeToken(req.headers['x-access-token'])
  } catch (e) {
    res.status(HttpStatus.CONFLICT).send({
      message: "There was a problem validating the data!",
      error: true
    });
    return 0;
  }

  if (token_return == null || token_return == undefined) {
    res.status(HttpStatus.CONFLICT).send({
      message: "There was a problem validating the data!",
      error: true
    });
    return 0;
  }

  try {
    let retorno = await repository.getCustomPlateBid(req.params.id);
    let custom_order = await repository.createCustomOrder(retorno);
    let basket = await repoBasket.getUserBasket(token_return.id)

    let body = {
      quantity: retorno.quantity,
      basket_type: 'custom_plate',
      basketId: basket[0].id,
      customPlateId: custom_order.id
    }
    basket = JSON.stringify(basket);
    basket = JSON.parse(basket);
    basket = basket[0]
    await repoBasket.createBasketItem(body);
    res.status(HttpStatus.CREATED).send({
      message: "Bid accepted, let's checkout now!",
      plate_data: custom_order,
      basket: basket
    });
    return 0;
  } catch (e) {
    console.log("Error: ", e)
    res.status(HttpStatus.CONFLICT).send({
      message: "Failed to select bid!",
      error: true,
      data: e
    });
    return 0;
  }
}

exports.payCustomPlate = async (req, res, next) => {
  const token_return = await authService.decodeToken(req.headers['x-access-token'])
  let existUser = await User.findOne({ where: { id: token_return.id } });
  if (existUser == null || existUser.user_type !== 'user' || existUser == undefined) {
    res.status(HttpStatus.CONFLICT).send({
      message: "There was a problem validating the data!",
      error: true
    });
    return 0;
  }
  const user_address = await repositoryShip.getExistAddress(req.body.shipping_id)
  if (user_address === null || user_address === '' || user_address === undefined) {
    res
    .status(HttpStatus.CONFLICT)
    .send({ message: "Fail to get user address!", error: true });
    return 0;
  }
  let user_basket = await repositoryCart.getOneUserBasket(token_return.id)
  let basket_content = await repositoryCart.listBasketCustom(user_basket.id)
  if (basket_content === null || basket_content === '' || basket_content === undefined) {
    res
    .status(HttpStatus.CONFLICT)
    .send({ message: "Fail to get user shopping cart!", error: true });
    return 0;
  }
  let itens = basket_content.BasketItems;
  let cart_itens = itens.map( async ( elem ) => {
    let element = {
      chef_id: elem.custom_plate.userId,
      name: elem.custom_plate.name,
      description: elem.custom_plate.description,
      amount: elem.custom_plate.price * 100,
      currency: 'usd',
      quantity: elem.quantity,
    }
    return element;
  });
  cart_itens = await Promise.all(cart_itens)
  let total_cart = cart_itens.reduce( ( prevVal, elem ) => prevVal + parseFloat(elem.quantity * elem.amount), 0 );
  let payload = {
    shippingId: req.body.shipping_id,
    basketId: user_basket.id,
    userId: token_return.id,
    total_itens: itens.length,
    order_total: total_cart / 100,
  }

  let create_order, card_return, user_return, confirm
  try {
    create_order = await repositoryOrder.create(payload);
  } catch (e) {
    console.log("create: ", e)
    res.status(HttpStatus.CONFLICT).send({
      message: 'There was a problem to create your order!',
      data: e,
      error: true
    });
    return 0;
  }
  try {
    if (existUser.user_ip) {
      user_return = await paymentService.getUser(existUser.user_ip);
    } else {
      user_return = await paymentService.createUser(existUser, user_address);
      existUser = await User.findOne({ where: { id: token_return.id } });
      existUser.user_ip = user_return.id
      await existUser.save()
    }
  } catch (e) {
    console.log(e);
    let retorn = {
      orderId: create_order.id,
      payment_id: null,
      amount: total_cart,
      client_secret: null,
      customer: e.raw.requestId,
      payment_method: null,
      status: e.raw.code,
      receipt_url: null,
      card_brand: null,
      card_country: null,
      card_exp_month: null,
      card_exp_year: null,
      card_fingerprint: null,
      card_last: null,
      network_status: null,
      risk_level: null,
      risk_score: null,
      seller_message: e.raw.message,
      type: e.raw.type,
      paid: false,
    }
    await repositoryOrderPayment.create(retorn);
    await repositoryOrder.editState(create_order.id, 'declined')
    res.status(HttpStatus.CONFLICT).send({
      message: 'There was a problem to create your payment data!',
      data: e,
      error: true
    });
    return 0;
  }

  try {
    card_return = await paymentService.createCard(existUser, user_address, req.body.card);
  } catch (e) {
    console.log("createCard: ", e)
    let retorn = {
      orderId: create_order.id,
      payment_id: null,
      amount: total_cart,
      client_secret: null,
      customer: e.raw.requestId,
      payment_method: null,
      status: e.raw.code,
      receipt_url: null,
      card_brand: null,
      card_country: null,
      card_exp_month: null,
      card_exp_year: null,
      card_fingerprint: null,
      card_last: null,
      network_status: null,
      risk_level: null,
      risk_score: null,
      seller_message: e.raw.message,
      type: e.raw.type,
      paid: false,
    }
    await repositoryOrderPayment.create(retorn);
    await repositoryOrder.editState(create_order.id, 'declined')
    res.status(HttpStatus.CONFLICT).send({
      message: 'There was a problem to validate your card!',
      data: e,
      error: true
    });
    return 0;
  }

  let user_card = await paymentService.attachUser(card_return.id, user_return.id);

  try {
    confirm = await paymentService.confirmPayment(total_cart, user_card.id, user_return.id);
  } catch (e) {
    console.log("confirmPayment: ", e)
    await repository.editState(create_order.id, 'declined')
    res.status(HttpStatus.CONFLICT).send({
      message: 'There was a problem to confirm your payment!',
      data: e,
      error: true
    });
    return 0;
  }

  let data_full = await helpers.change_data(create_order.id, confirm);

  try {
    await repositoryOrderPayment.getWallet(existUser.id);
  } catch (e) {
    res.status(HttpStatus.CONFLICT).send({
      message: 'There was a problem to save your data!',
      data: e,
      error: true
    });
    return 0;
  }
  const create_orderPayment = await repositoryOrderPayment.create(data_full);

  if (create_orderPayment.status === 'succeeded' && create_orderPayment.type === 'authorized') {
    await repositoryOrder.editState(create_order.id, 'aproved')

    let bulkTransactions = cart_itens.map(elem => (
      {
        identifier:'order_payment',
        userId:elem.chef_id,
        orderId:create_order.id,
        orderPaymentId:create_orderPayment.id,
        amount:elem.amount
      }
    ))

    let transactionsService = new TransactionsService();
    transactionsService.recordBulkCreditTransaction(bulkTransactions)

    res.status(HttpStatus.ACCEPTED).send({
      message: 'Your order was successfully paid!',
      payment_return: create_orderPayment
    });
    return 0;
  }



  res.status(HttpStatus.CONFLICT).send({
    message: "There was a problem validating the data!",
    user_address: user_address,
    user_basket: user_basket,
    basket_content: basket_content,
    cart_itens: cart_itens,
    total_cart: total_cart,
    payload: payload,
    create_order: create_order
  });
  return 0;
}

exports.listCustomOrders = async (req, res, next) => {
  const token_return = await authService.decodeToken(req.headers['x-access-token'])
  const { userId } = req.params;
  const existUser = await User.findOne({ where: { id: token_return.id } });
  if (existUser == null || existUser.user_type !== 'chef' || existUser == undefined) {
    res.status(HttpStatus.CONFLICT).send({
      message: "There was a problem validating the data!",
      error: true
    });
    return 0;
  }

  const retorno = await CustomPlateOrder.findAll({ where: { userId } });
  res.status(HttpStatus.ACCEPTED).send({
    message: "Your custom order's",
    data: retorno
  });
  return 0;
};