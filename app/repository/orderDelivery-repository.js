'use strict';
const { OrderDelivery, User } = require("../models/index");
const path = require('path');
const orderDeliveryConstants = require(path.resolve('app/constants/order-delivery'));

//deprecated
exports.createdOrderDeliveryByOrder = async (orderId) => {
  let orderDelivery = {
    orderId: orderId,
    state_type: orderDeliveryConstants.STATE_TYPE_PENDING
  };

  let createdDrderDelivery = await OrderDelivery.create(orderDelivery);
  return createdDrderDelivery;
}

exports.updateStatus = async (orderDeliveryId,status) => {
  let orderDelivery = await OrderDelivery.findByPk(orderDeliveryId);
  orderDelivery.state_type=status;
  OrderDelivery.save();
  return true;
}

exports.createOrderDelivery = async (data) => {
  let orderDelivery = await OrderDelivery.create({ ...data });
  return orderDelivery;
}

/**
* TODO use bulk create in future
*/
exports.createOrderDeliveries = async(dataArray) => {
  //return await OrderDelivery.bulkCreate(dataArray);
  const orderItems = dataArray.map(async(data) => {
    return await exports.createOrderDelivery(data);
  });

  return Promise.all(orderItems);
}

exports.findByPk = async (id) => {
  try {
    const orderDelivery = await OrderDelivery.findByPk(id);
    return orderDelivery;
  } catch (e) {
    return { message: "Erro to return order Delivery!", error: e}
  }
}

exports.getOrderDeliveriesByDriver = async ({driverId, state_type, pagination}) => {
  const whereQuery = {driverId};
  if(state_type) {
    whereQuery.state_type = state_type;
  }

  const deliveries = await OrderDelivery.findAll(
    {
      where: whereQuery,
      ...pagination
    }
  );
  return deliveries;
};

exports.getOrderDeliveriesByUser = async ({userId, state_type, pagination}) => {
  const whereQuery = {userId};
  if(state_type) {
    whereQuery.state_type = state_type;
  }

  const deliveries = await OrderDelivery.findAll(
    {
      where: whereQuery,
      ...pagination
    }
  );
  return deliveries;
};
