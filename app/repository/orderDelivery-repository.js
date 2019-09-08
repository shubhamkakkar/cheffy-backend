'use strict';
const { OrderDelivery, User } = require("../models/index");


exports.createdOrderDelivery = async (orderId) => {
  let orderDelivery = {
    orderId: orderId,
    state_type: 'created'
  }

  let createdDrderDelivery = await OrderDelivery.create(orderDelivery);
  return createdDrderDelivery;
}

exports.updateStatus = async (orderDeliveryId,status) => {
  let orderDelivery = await OrderDelivery.findByPk(orderDeliveryId);
  orderDelivery.state_type=status;
  OrderDelivery.save();
  return true;
}

exports.orderDeliveryRepository = async (data) => {
  let orderDelivery = await OrderDelivery.create({ ...data });
  return orderDelivery;
}

exports.findByPk = async (data) => {
  try {
    const orderDelivery = await OrderDelivery.findByPk(data);
    return orderDelivery;
  } catch (e) {
    return { message: "Erro to return order Delivery!", error: e}
  }
}
