"use strict";
var HttpStatus = require("http-status-codes");
const {sequelize, User, OrderDelivery } = require('../models/index');
const ValidationContract = require("../services/validator");
const orderRepository = require("../repository/order-repository");
const deliveryRepository = require("../repository/delivery-repository");
const demandService = require('../services/demands');
const authService = require("../services/auth");
const NotificationServices = require('../services/notification');

exports.list = async (req, res, next) => {

  const token_return = await authService.decodeToken(req.headers['x-access-token'])
  const existUser = await User.findOne({ where: { id: token_return.id } });

  if (existUser.user_type !== 'driver' && existUser.user_type !== 'cheff') {
      res.status(HttpStatus.CONFLICT).send({ message: "Only drivers and cheffs can have deliveries", error: true}).end();
    return 0;
  }


  let deliveries = await deliveryRepository.getOrderDeliveriesByUserId(existUser.id)

  if(!deliveries){
      res.status(HttpStatus.CONFLICT).send({ message: "we couldn't find the user's deliveries", status: HttpStatus.CONFLICT});
      return 0;
  }else{
      let payload = {};
      payload.status = HttpStatus.CREATED;
      payload.deliveries = deliveries;
      res.status(payload.status).send(payload);
  }

}

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

exports.createDelivery = async (req, res, next) => {
  try {
    let contract = new ValidationContract();
    contract.isRequired(req.params.id, 'The order ID is required!');
  
    if (!contract.isValid()) {
      res.status(HttpStatus.CONFLICT).send({ message: contract.errors(), status: HttpStatus.NON_AUTHORITATIVE_INFORMATION }).end();
      return 0;
    }

    const token_return = await authService.decodeToken(req.headers['x-access-token'])
    if (!token_return) {
      res.status(HttpStatus.CONFLICT).send({
        message: "You must be logged in to add items to cart",
        error: true
      });
    }

    const existUser = await User.findOne({ where: { id: token_return.id } });
  
    if (!existUser) {
      res.status(HttpStatus.CONFLICT).send({ message: "Driver not found", error: true}).end();
      return 0;
    }    

    let orderId = req.params.id;
    let createdOrderDelivery = await deliveryRepository.createOrderDelivery(orderId);
    
    //demandService.sendToDelivery(orderId,loc,shipping)
    
    let payload = {};
    payload.status = HttpStatus.CREATED;
    payload.orderDelivery = createdOrderDelivery;
    res.status(payload.status).send(payload);

  } catch (e) {
    console.log(e)
    res.status(HttpStatus.CONFLICT).send({ message: "There was a problem ", e: true}).end();    
    throw e;
  }

}

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

exports.getOrderDeliveriesByUserId = async (req, res, next) => {
  try {
      const deliveries = await OrderDelivery.findAll(
        { 
          where: { 
            driverId: token_return.id 
          } 
        });

      return deliveries;
    } catch (e) {
      console.log(e)
      throw e;
    }

}

exports.getById = async (req, res, next) => {
  try {
    const order = await deliveryRepository.getById(req.params.id);
    if(order){
      res.status(200).send(order);
    }else{
      res.status(404).send({
        message: 'Order not found'
      });
    }
  } catch (e) {
    res.status(500).send({
      message: 'Failed to process your request'
    });
  }
}
