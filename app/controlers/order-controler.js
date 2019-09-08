"use strict";
var HttpStatus = require("http-status-codes");
const ValidationContract = require("../services/validator");
const repository = require("../repository/order-repository");
const repositoryOrderPayment = require("../repository/orderPayment-repository");
const plateRepository = require("../repository/orderPayment-repository");
const repositoryShip = require("../repository/shipping-repository");
const repositoryCart = require('../repository/basket-repository');
const md5 = require("md5");
const authService = require("../services/auth");
const paymentService = require("../services/payment");
const controlerHelper = require("./controler-helper");
const TransactionsService = require("../services/transactions")

function distance(lat1,lon1,lat2,lon2) {
  var R = 6371;
  var dLat = (lat2-lat1) * Math.PI / 180;
  var dLon = (lon2-lon1) * Math.PI / 180;
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
   Math.cos(lat1 * Math.PI / 180 ) * Math.cos(lat2 * Math.PI / 180 ) *
   Math.sin(dLon/2) * Math.sin(dLon/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c;
  if (d>1) return Math.round(d)+"km";
  else if (d<=1) return Math.round(d*1000)+"m";
  return d;
}

const change_data = async (id, data) => {
  let base = {
    orderId: id,
    payment_id: data.id,
    amount: data.amount,
    client_secret: data.client_secret,
    customer: data.customer,
    payment_method: data.payment_method,
    status: data.status,
    receipt_url: data.charges.data[0].receipt_url,
    card_brand: data.charges.data[0].payment_method_details.card.brand,
    card_country: data.charges.data[0].payment_method_details.card.country,
    card_exp_month: data.charges.data[0].payment_method_details.card.exp_month,
    card_exp_year: data.charges.data[0].payment_method_details.card.exp_year,
    card_fingerprint: data.charges.data[0].payment_method_details.card.fingerprint,
    card_last: data.charges.data[0].payment_method_details.card.last4,
    network_status: data.charges.data[0].outcome.network_status,
    risk_level: data.charges.data[0].outcome.risk_level,
    risk_score: data.charges.data[0].outcome.risk_score,
    seller_message: data.charges.data[0].outcome.seller_message,
    type: data.charges.data[0].outcome.type,
    paid: data.charges.data[0].paid,
  }
  return base;
}

// TODO: @Natan
const post_process = async (user_data, shipping, user_basket, basket_content, confirmation, order_id) => {
  let cart_itens = basket_content.BasketItems.map( async ( elem ) => {
    let loc = await repository.userLocation(elem.plate.userId);
    let wallet = await repositoryOrderPayment.getWallet(elem.plate.userId);
    let element = {
      orderId: order_id,
      walletId: wallet,
      plate_id: elem.plate.id,
      user_id: elem.plate.userId,
      chef_location: loc,
      name: elem.plate.name,
      description: elem.plate.description,
      amount: elem.plate.price,
      quantity: elem.quantity,
    }
    return element;
  });
  let basket_info = {
    id: user_basket.id,
    itens: await Promise.all(cart_itens)
  }
  await controlerHelper.createOrderItens(basket_info.itens)
  let user_info = {
    id: user_data.id,
    name: user_data.name,
    email: user_data.email,
    phone: `${user_data.country_code + user_data.phone_no}`,
    shipping_address: {
      id: shipping.id,
      line1: shipping.addressLine1,
      line2: shipping.addressLine2,
      city: shipping.city,
      state: shipping.state,
      zip_code: shipping.zipCode,
      lat: shipping.lat,
      lon: shipping.lon
    },
    basket: basket_info,
    payment_confirmation: confirmation,
  }

  return;
}

exports.list = async (req, res, next) => {
  const token_return =  await authService.decodeToken(req.headers['x-access-token'])
  if (!token_return) {
    res.status(HttpStatus.CONFLICT).send({
      message: "You must be logged in to check your orders",
      error: true
    });
  }
  try {
    const user_orders = await repository.getUserOrders(token_return.id)
    res.status(HttpStatus.ACCEPTED).send({
      message: 'Here are your orders!',
      data: user_orders
    });
    return 0;
  } catch (e) {
    console.log(e)
    res.status(HttpStatus.CONFLICT).send({
      message: 'Fail to get your orders!',
      error: true
    });
    return 0;
  }
}

exports.listTracking = async (req, res, next) => {
  const token_return =  await authService.decodeToken(req.headers['x-access-token'])
  if (!token_return) {
    res.status(HttpStatus.CONFLICT).send({
      message: "You must be logged in to check your orders",
      error: true
    });
  }
  try {
    const user_orders = await repository.getUserOrdersBeingDelivered(token_return.id)
    res.status(HttpStatus.ACCEPTED).send({
      message: 'Here are your orders!',
      data: user_orders
    });
    return 0;
  } catch (e) {
    console.log(e)
    res.status(HttpStatus.CONFLICT).send({
      message: 'Fail to get your orders!',
      error: true
    });
    return 0;
  }
}

exports.getOneOrder = async (req, res, next) => {
  const token_return = await authService.decodeToken(req.headers['x-access-token'])
  if (!token_return) {
    res.status(HttpStatus.CONFLICT).send({
      message: "You must be logged in to check your orders",
      error: true
    });
  }
  try {
    const user_orders = await repository.getUserOrder(token_return.id, req.params.id)
    res.status(HttpStatus.ACCEPTED).send({
      message: 'Here are your order!',
      data: user_orders
    });
    return 0;
  } catch (e) {
    console.log(e)
    res.status(HttpStatus.CONFLICT).send({
      message: 'Fail to get your orders!',
      error: true
    });
    return 0;
  }
}
exports.create = async (req, res, next) => {
  if (!req.body.shipping_id) {
    res.status(HttpStatus.CONFLICT).send({
      message: "We couldn't find your shipping address!",
      status: HttpStatus.CONFLICT
    });
    return 0;
  }
  if (!req.body.card.number) {
    res.status(HttpStatus.CONFLICT).send({
      message: "We couldn't find your card number!",
      status: HttpStatus.CONFLICT
    });
    return 0;
  }
  if (!req.body.card.exp_month) {
    res.status(HttpStatus.CONFLICT).send({
      message: "We couldn't find your card expiration month!",
      status: HttpStatus.CONFLICT
    });
    return 0;
  }
  if (!req.body.card.exp_year) {
    res.status(HttpStatus.CONFLICT).send({
      message: "We couldn't find your card expiration year!",
      status: HttpStatus.CONFLICT
    });
    return 0;
  }
  if (!req.body.card.cvc) {
    res.status(HttpStatus.CONFLICT).send({
      message: "We couldn't find your card CVC!",
      status: HttpStatus.CONFLICT
    });
    return 0;
  }
  const token_return = await authService.decodeToken(req.headers['x-access-token']);
  const user_data = await repository.user(token_return.id)
  if (user_data === null || user_data === '' || user_data === undefined) {
    res
      .status(HttpStatus.CONFLICT)
      .send({ message: "Fail to get user data!", error: true });
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
  let basket_content = await repositoryCart.listBasket(user_basket.id)

  if (basket_content === null || basket_content === '' || basket_content === undefined) {
    res
    .status(HttpStatus.CONFLICT)
    .send({ message: "Fail to get user shopping cart!", error: true });
    return 0;
  }

  let itens = basket_content.BasketItems;
  let cart_itens = itens.map( async ( elem ) => {
    let element = {
      chef_id: elem.plate.userId,
      name: elem.plate.name,
      description: elem.plate.description,
      amount: elem.plate.price * 100,
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
    create_order = await repository.create(payload);
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
    user_return = await paymentService.createUser(user_data, user_address);
  } catch (e) {
    res.status(HttpStatus.CONFLICT).send({
      message: 'There was a problem to create your payment data!',
      data: e,
      error: true
    });
    return 0;
  }
  try {
    card_return = await paymentService.createCard(user_data, user_address, req.body.card);
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
    await repository.editState(create_order.id, 'declined')
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


  let data_full = await change_data(create_order.id, confirm);

  try {
    const create_wallet = await repositoryOrderPayment.getWallet(user_data.id);
  } catch (e) {
    res.status(HttpStatus.CONFLICT).send({
      message: 'There was a problem to save your data!',
      data: e,
      error: true
    });
    return 0;
  }

  const create_orderPayment = await repositoryOrderPayment.create(data_full);

  await post_process(user_data, user_address, user_basket, basket_content, data_full, create_order.id)


  if (create_orderPayment.status === 'succeeded' && create_orderPayment.type === 'authorized') {
    await repository.editState(create_order.id, 'aproved')

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
  await repository.editState(create_order.id, 'declined')
  res.status(HttpStatus.CONFLICT).send({
    message: 'There was a problem paying your order!',
    payment_return: create_orderPayment,
    error: true
  });
}

exports.createOrderReview = async (req, res, next) => {
  try {
    let order,orderItem ,token_return;

    try {
      order = await repository.getById(req.params.id);
      orderItem = await repository.getOrderItemById(req.body.orderItemId);

      if(!order){
        res.status(409).send({ message: 'Order not find!'});
        return;
      }

      if(!orderItem){
        res.status(409).send({ message: 'OrderItem not find!'});
        return;
      }

      if(orderItem.orderId !== order.id){
        res.status(409).send({ message: 'OrderItem does not belongs to this order!'});
        return;
      }

    } catch (error) {
      res.status(409).send({ message: 'Error retrieving the order'});
      return;
    }

    try {
      token_return = await authService.decodeToken(req.headers['x-access-token'])
    } catch (error) {
      res.status(409).send({ message: 'Token expired'});
      return;
    }

    let full_data = req.body;
    full_data.userId = token_return.id;
    full_data.orderId = req.params.id;

      const createdPlateReview = await repository.createOrderReview(full_data);
    res.status(200).send({ message: 'Review created!', data: createdPlateReview });
    return;


  } catch (e) {
    res.status(500).send({
      message: 'Failed to process your request'
    });
  }
};
