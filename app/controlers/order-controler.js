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

const post_process = async (user_data, shipping, user_basket, basket_content, confirmation, order_id) => {
  let cart_itens = basket_content.BasketItems.map( async ( elem ) => {
    let loc = await repository.userLocation(elem.plate.userId);
    let wallet = await repositoryOrderPayment.getWallet(elem.plate.userId);
    let element = {
      orderId: order_id,
      walletId: wallet,
      plate_id: elem.plate.id,
      user_id: elem.plate.userId,
      chef_location: `${loc.addressLine1}, ${loc.addressLine2}, ${loc.city}-${loc.state} / ${loc.zipCode}`,
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

  return user_info;
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
  const contract = new ValidationContract();

  contract.isRequired(req.body.shipping_id, "We couldn't find your shipping address!");
  //contract.isRequired(req.body.card.number, "We couldn't find your card number!");
  //contract.isRequired(req.body.card.exp_month, "We couldn't find your card expiration month!");
  //contract.isRequired(req.body.card.exp_year, "We couldn't find your card expiration year!");
  //contract.isRequired(req.body.card.cvc, "We couldn't find your card CVC!");
  
  if (!contract.isValid()) {
    res.status(HttpStatus.CONFLICT).send(contract.errors()).end();
    return 0;
  }

  const token_return = await authService.decodeToken(req.headers['x-access-token']);
  const user_data = await repository.user(token_return.id);

  if (!user_data) {
    res.status(HttpStatus.CONFLICT).send({ message: "Fail to get user data!", error: true });
    return 0;
  }

  const user_address = await repositoryShip.getExistAddress(req.body.shipping_id);
  if (!user_address) {
    res.status(HttpStatus.CONFLICT).send({ message: "Fail to get user address!", error: true });
    return 0;
  }
  let user_basket = await repositoryCart.getOneUserBasket(token_return.id)
  let basket_content = await repositoryCart.listBasket(user_basket.id)

  if (!basket_content) {
    res.status(HttpStatus.CONFLICT).send({ message: "Fail to get user shopping cart!", error: true });
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
    state_type: 'pending',
    order_total: total_cart / 100,
  }

  //create order at database BasketItems --> Basket --> [Create Order]
  const create_order = await repository
    .create(payload)
    .catch( e => {
      console.log("create: ", e)
      res.status(HttpStatus.CONFLICT).send({
        message: 'There was a problem to create your order!',
        data: e,
        error: true
      });
      return 0;
    });
  const data_full = { orderId: create_order.id, amount: payload.order_total, status: 'pending' };
  await repositoryOrderPayment.getWallet(user_data.id);
  const create_orderPayment = await repositoryOrderPayment.create(data_full);

  await post_process(user_data, user_address, user_basket, basket_content, data_full, create_order.id)

  res.status(HttpStatus.CONFLICT).send({
    message: 'Order available for payment!',
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

exports.ordersReadyForDelivery = async (req, res, next) => {
  const token_return =  await authService.decodeToken(req.headers['x-access-token'])
  if (!token_return) {
    res.status(HttpStatus.CONFLICT).send({
      message: "You must be logged in to check your orders",
      error: true
    });
  }
  try {
    const orders_ready = await repository.getOrdersReadyDelivery();
    res.status(HttpStatus.ACCEPTED).send({
      message: 'Orders ready for delivery!',
      data: orders_ready
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
};