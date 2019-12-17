"use strict";
const path = require('path');
const HttpStatus = require("http-status-codes");
const {sequelize, User, OrderDelivery } = require('../models/index');
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


exports.orderDeliveryByIdMiddleware = asyncHandler(async(req, res, next, orderDeliveryId) => {
  const orderDelivery = deliveryRepository.findByPk(orderDeliveryId);
  if(!orderDelivery) return res.status(HttpStatus.NOT_FOUND).send({message: `Order Delivery Not Found by id ${orderDeliveryId}`});
  req.orderDelivery = orderDelivery;
  next();
});

//Is this the pending deliveries of a user
exports.list = asyncHandler(async (req, res, next) => {
  const user = req.user;

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
    ...pagination.paginateInfo(query)
  });

});


exports.edit = async (req, res, next) => {
  try {
    const token_return = await authService.decodeToken(req.headers['x-access-token'])
    const existUser = await User.findOne({ where: { id: token_return.id } });

    if (!existUser) {
      res.status(HttpStatus.CONFLICT).send({ message: "Driver not found", error: true}).end();
      return 0;
    }

    let orderDeliveryId = req.params.id;
    const order = await OrderDelivery.findByPk(orderDeliveryId);
    order.driverId = existUser.id;
    order.status_type = 'on_course';
    order.save();

    return order;
  } catch (e) {
    console.log(e)
    throw e;
  }

}

exports.completeDelivery = async (req, res, next) => {
  try {
    const token_return = await authService.decodeToken(req.headers['x-access-token'])
    const existUser = await User.findOne({ where: { id: token_return.id } });

    if (!existUser) {
      res.status(HttpStatus.CONFLICT).send({ message: "Driver not found", error: true}).end();
      return 0;
    }

    let orderDeliveryId = req.params.id;
    const order = await OrderDelivery.findByPk(orderDeliveryId);
    order.status_type = 'delivered';
    order.save();

    let payload = {};
    payload.status = HttpStatus.OK;
    payload.message = "Thank you!"
    res.status(payload.status).send(payload);

  } catch (e) {
    console.log(e)
    res.status(HttpStatus.CONFLICT).send({ message: "Driver not found", error: true}).end();
    throw e;
  }

}

exports.pickupDelivery = async (req, res, next) => {
  try {
    const token_return = await authService.decodeToken(req.headers['x-access-token'])
    const existUser = await User.findOne({ where: { id: token_return.id } });

    if (!existUser) {
      res.status(HttpStatus.CONFLICT).send({ message: "Driver not found", error: true}).end();
      return 0;
    }

    let orderDeliveryId = req.params.id;
    let order = await OrderDelivery.findByPk(orderDeliveryId);
    order.state_type = 'picked_up';
    order.save();

    let payload = {};
    payload.status = HttpStatus.OK;
    payload.message = "Great! The costumer is waiting for you!"
    payload.delivery =  await OrderDelivery.findByPk(orderDeliveryId);
    res.status(payload.status).send(payload);
  } catch (e) {
    console.log(e)
    res.status(HttpStatus.CONFLICT).send({ message: "Driver not found", error: true}).end();
    throw e;
  }

}

exports.createDelivery = asyncHandler(async (req, res, next) => {

    let contract = new ValidationContract();
    contract.isRequired(req.params.orderId, 'The order ID is required!');

    if (!contract.isValid()) {
      return res.status(HttpStatus.CONFLICT).send(contract.errors()).end();
    }

    const existUser = req.user;

    const payload = {
      orderId: req.order.id,
      order_delivery_type: orderDeliveryConstants.DELIVERY_TYPE_ORDER,
      userId: req.order.userId,
      driverId: req.userId,
      state_type: orderDeliveryConstants.STATE_TYPE_PENDING,

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

exports.decline = async (req, res, next) => {
  try {
      const token_return = await authService.decodeToken(req.headers['x-access-token'])
      const existUser = await User.findOne({ where: { id: token_return.id } });

      if (!existUser) {
        res.status(HttpStatus.CONFLICT).send({ message: "Driver not found", error: true}).end();
        return 0;
      }

      let orderDeliveryId = req.params.id;
      const order = await OrderDelivery.findByPk(orderDeliveryId);

      if(order){
        order.driverId = existUser.id;
        order.state_type = 'declined';
        order.save();
        res.status(200).send(order);
      }else{
        res.status(404).send({
          message: 'Order not found'
         });
        }

      return order;
    } catch (e) {
      console.log(e)
      throw e;
    }

}

exports.accept = async (req, res, next) => {
  try {
      const token_return = await authService.decodeToken(req.headers['x-access-token'])
      const existUser = await User.findOne({ where: { id: token_return.id } });

      if (!existUser) {
        res.status(HttpStatus.CONFLICT).send({ message: "Driver not found", error: true}).end();
        return 0;
      }

      let orderDeliveryId = req.params.id;
      const order = await OrderDelivery.findByPk(orderDeliveryId);

      if(order){
        order.driverId = existUser.id;
        order.state_type = 'delivering';
        order.save();
        res.status(200).send(order);
      }else{
        res.status(404).send({
          message: 'Order not found'
         });
        }

      return order;
    } catch (e) {
      console.log(e)
      throw e;
    }

}

exports.completeDelivery = async (req, res, next) => {
  try {
    const token_return = await authService.decodeToken(req.headers['x-access-token'])
    const existUser = await User.findOne({ where: { id: token_return.id } });

    if (!existUser) {
      res.status(HttpStatus.CONFLICT).send({ message: "Driver not found", error: true}).end();
      return 0;
    }

    try{
      let orderDeliveryId = req.params.id;
      let orderDelivery = await OrderDelivery.findByPk(orderDeliveryId);
      orderDelivery.driverId = existUser.id;
      orderDelivery.state_type = 'delivered';
      orderDelivery.dropoff_time = sequelize.literal('CURRENT_TIMESTAMP');
      orderDelivery.save();

      //Notify the Cheff
      new NotificationServices()
      .sendPushNotificationToUser(orderDelivery.chefId,
        {
          type:"delivery_complete",
          orderId:orderDelivery.orderId
        }
      );

      orderDelivery = await OrderDelivery.findByPk(orderDeliveryId);
      res.status(HttpStatus.ACCEPTED).send(orderDelivery).end();

    }catch(err){
      res.status(HttpStatus.CONFLICT).send({ message: "There was a problem ", error: true}).end();
    }
    return order;
  } catch (e) {
    console.log(e)
    throw e;
  }
}

exports.pickupDelivery = async (req, res, next) => {
  try {
    const token_return = await authService.decodeToken(req.headers['x-access-token'])
    const existUser = await User.findOne({ where: { id: token_return.id } });

    if (!existUser) {
      res.status(HttpStatus.CONFLICT).send({ message: "Driver not found", error: true}).end();
      return 0;
    }

    try{
      let orderDeliveryId = req.params.id;
      let orderDelivery = await OrderDelivery.findByPk(parseInt(orderDeliveryId));
      orderDelivery.driverId = existUser.id;
      orderDelivery.state_type = 'on_course';
      orderDelivery.pickup_time = sequelize.Sequelize.literal('CURRENT_TIMESTAMP');
      orderDelivery.save();

      //Notify the Cheff
      new NotificationServices()
      .sendPushNotificationToUser(orderDelivery.chefId,
        {
          type:"delivery_complete",
          orderId:orderDelivery.orderId
        }
      );
      orderDelivery = await OrderDelivery.findByPk(parseInt(orderDeliveryId));
      res.status(HttpStatus.ACCEPTED).send(orderDelivery).end();

    }catch(err){
      res.status(HttpStatus.CONFLICT).send({ message: "There was a problem ", error: true}).end();
    }
  } catch (e) {
    console.log(e)
    throw e;
  }
}

exports.getById = asyncHandler(async (req, res, next) => {
  const orderDelivery = req.orderDelivery;
  res.status(HttpStatus.OK).send(orderDelivery.get({plain: true}));
});
