"use strict";
const path = require('path');
const HttpStatus = require("http-status-codes");
const {sequelize, User, OrderDelivery, Order } = require('../models/index');
const ValidationContract = require("../services/validator");
const orderRepository = require("../repository/order-repository");
const deliveryRepository = require("../repository/delivery-repository");
const demandService = require('../services/demands');
const authService = require("../services/auth");
const NotificationServices = require('../services/notification');
const userConstants = require(path.resolve('app/constants/users'));
const asyncHandler = require('express-async-handler');
const orderDeliveryConstants = require(path.resolve('app/constants/order-delivery'));
const paginator = require(path.resolve('app/services/paginator'));
const appConfig = require(path.resolve('config/app'));
const shippingAddressConstants = require(path.resolve('app/constants/shipping-address'));
const utils = require(path.resolve('app/utils'));

exports.orderDeliveryByIdMiddleware = asyncHandler(async(req, res, next, orderDeliveryId) => {
  const orderDelivery = await deliveryRepository.getById(orderDeliveryId);
  if(!orderDelivery) return res.status(HttpStatus.NOT_FOUND).send({message: `Order Delivery Not Found by id ${orderDeliveryId}`});
  req.orderDelivery = orderDelivery;

  next();
});

//Is this the pending deliveries of a user
exports.list = asyncHandler(async (req, res, next) => {
  const userId = req.userId;
  const user = await User.findOne({ where: { id: userId }});

  if (user.user_type !== userConstants.USER_TYPE_DRIVER && user.user_type !== userConstants.USER_TYPE_CHEF) {
    return res.status(HttpStatus.CONFLICT).send({ message: "Only drivers and cheffs can have deliveries", error: true}).end();
  }


  let deliveries = await deliveryRepository.getOrderDeliveriesByUserId(user.id)

  if(!deliveries){
      return res.status(HttpStatus.CONFLICT).send({ message: "we couldn't find the user's deliveries", status: HttpStatus.CONFLICT});
  }

  let payload = {};
  payload.status = HttpStatus.CREATED;
  payload.deliveries = deliveries;
  res.status(payload.status).send(payload);
});

/*
exports.pendingList = asyncHandler(async (req, res, next) => {
  const user = req.user;

  if (user.user_type !== userConstants.USER_TYPE_DRIVER && user.user_type !== userConstants.USER_TYPE_CHEF) {
    return res.status(HttpStatus.CONFLICT).send({ message: "Only drivers and cheffs can have deliveries", error: true}).end();
  }

  let deliveries = await deliveryRepository.getOrderDeliveriesPendingByUserId(user.id)

  if(!deliveries){
      return res.status(HttpStatus.CONFLICT).send({ message: "we couldn't find the user's deliveries", status: HttpStatus.CONFLICT});
  }

  let payload = {};
  payload.status = HttpStatus.CREATED;
  payload.deliveries = deliveries;
  res.status(payload.status).send(payload);
});
*/

exports.listCompleteDeliveries = async (req, res, next) => {
  const token_return =  await authService.decodeToken(req.headers['x-access-token'])
  if (!token_return) {
    res.status(HttpStatus.CONFLICT).send({
      message: "You must be logged in to check your orders",
      error: true
    });
  }
  try {
    const user_orders = await deliveryRepository.getCompletedDeliveriesByUser(token_return.id)
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

exports.listPendingDeliveries = asyncHandler(async (req, res, next) => {
  const pagination = paginator.paginateQuery(req);
  const query = { userId: req.userId, pagination};

  const user_orders = await deliveryRepository.getPendingDeliveriesByUser(query);

  res.status(HttpStatus.ACCEPTED).send({
    message: 'Here are your orders!',
    data: user_orders,
    ...paginator.paginateInfo(query)
  });

});

exports.listPendingDeliveriesDriver = asyncHandler(async (req, res, next) => {
  const pagination = paginator.paginateQuery(req);
  const query = { deliveryType: userConstants.USER_TYPE_DRIVER, pagination};

  const driver_orders = await deliveryRepository.getPendingDeliveriesByDriver(query);

  const driver_pending_orders = driver_orders.filter( item => item.OrderDelivery == null);

  res.status(HttpStatus.ACCEPTED).send({
    message: 'Here are your orders!',
    data: driver_pending_orders,
    ...paginator.paginateInfo(query)
  });

});


exports.createDelivery = asyncHandler(async (req, res, next) => {

    let contract = new ValidationContract();
    contract.isRequired(req.params.orderId, 'The order ID is required!');

    if (!contract.isValid()) {
      return res.status(HttpStatus.CONFLICT).send(contract.errors()).end();
    }

    const existUser = req.user;
    const user_order = await Order.findOne({where:{id:req.params.orderId}})

    const payload = {
      orderId: user_order.id,
      order_delivery_type: orderDeliveryConstants.DELIVERY_TYPE_ORDER,
      userId: user_order.userId,
      driverId: req.userId,
      state_type: orderDeliveryConstants.STATE_TYPE_PENDING,
      delieryType: orderDeliveryConstants.USER_TYPE_DRIVER

    };

    if(req.body.pickup_time) {
        payload.pickup_time = req.body.pickup_time;
    }

    if(req.body.dropoff_time) {
        payload.dropoff_time = req.body.dropoff_time;
    }

    let createdOrderDelivery = await deliveryRepository.createOrderDelivery(payload);

    //demandService.sendToDelivery(orderId,loc,shipping)

    let response = {};
    response.status = HttpStatus.CREATED;
    response.orderDelivery = createdOrderDelivery;
    res.status(response.status).send(response);

});


exports.editStateType = (message) => asyncHandler(async (req, res, next) => {
  const user = req.user;

  const updates = {...req.body};

  await req.orderDelivery.update(updates);

  const orderDelivery = await deliveryRepository.getById(req.orderDelivery.id);

  res.status(HttpStatus.OK).send({message: message || 'Updated', orderDelivery: orderDelivery.get({plain: true})});

  //Notify the Cheff
  new NotificationServices()
  .sendPushNotificationToUser(orderDelivery.driverId,
    {
      type: orderDelivery.state_type,
      orderDeliveryId: orderDelivery.id
    }
  );

});

exports.checkCanceled = (req, res, next) => {
  if(req.orderDelivery.state_type === orderDeliveryConstants.STATE_TYPE_CANCELED) {
    return res.status(HttpStatus.BAD_REQUEST).send({message: `OrderDelivery already canceled. orderDeliveryId: ${req.orderDelivery.id}`})
  }
  next();

};

exports.completeDelivery = [
  exports.checkCanceled,
  (req, res, next) => {
    req.body.state_type = orderDeliveryConstants.STATE_TYPE_DELIVERED;
    req.body.dropoff_time = sequelize.literal('CURRENT_TIMESTAMP');
    next();
  },
  exports.editStateType('Delivery Completed!')
];

exports.pickupDelivery = [
  exports.checkCanceled,
  (req, res, next) => {
    req.body.state_type = orderDeliveryConstants.STATE_TYPE_PICKED_UP;
    req.body.pickup_time = sequelize.literal('CURRENT_TIMESTAMP');
    next();
  },
  exports.editStateType('Great! The costumer is waiting for you!')
];

exports.reject = [
  exports.checkCanceled,
  (req, res, next) => {
    req.body.state_type = orderDeliveryConstants.STATE_TYPE_REJECTED;
    next();
  },
  exports.editStateType('Order Delivery Rejected!')
];


exports.accept = [
  exports.checkCanceled,
  (req, res, next) => {
    req.body.state_type = orderDeliveryConstants.STATE_TYPE_APPROVED;
    next();
  },
  exports.editStateType('Order Delivery Approved!')
];

exports.getById = asyncHandler(async (req, res, next) => {
  const orderDelivery = req.orderDelivery;
  res.status(HttpStatus.OK).send(orderDelivery.get({plain: true}));
});

/**
* Method: GET
* Default Price calculation in miles
*/
exports.getDeliveryPrice = asyncHandler( async(req, res, next) => {

  //distance is required
  if(!req.query.distance) {
    return res.status(HttpStatus.BAD_REQUEST).send({message: 'Distance is required. Required query param: distance'})
  }

  // check if distanceUnit is valid
  if(req.query.distanceUnit) {
    if ([
      shippingAddressConstants.DISTANCE_KM,
      shippingAddressConstants.DISTANCE_MILES
    ].indexOf(req.query.distanceUnit) === -1) {
      return res.status(HttpStatus.BAD_REQUEST).send({
        message: `Distance Unit should be one of:  ${shippingAddressConstants.DISTANCE_KM},
        ${shippingAddressConstants.DISTANCE_MILES}`,
      });
    }
  }

  let distance = req.query.distance;
  let distanceUnit = req.query.distanceUnit || shippingAddressConstants.DISTANCE_MILES;
  // default price calculation in miles
  let price = Number(distance) * appConfig.delivery.unitPrice;

  if(distanceUnit === shippingAddressConstants.DISTANCE_KM) {
    price = Number(distance) * shippingAddressConstants. MILES_KM_RATIO * appConfig.delivery.unitPrice;
  }

  price = utils.round2DecimalPlaces(price);

  return res.status(HttpStatus.OK).send({
    message: `Delivery Price Calculation based on ${distance} ${distanceUnit}`,
    info: 'The delivery price is based on route distance',
    availableDistanceUnits: `${shippingAddressConstants.DISTANCE_MILES}, ${shippingAddressConstants.DISTANCE_KM}`,
    price: price
  });

});
