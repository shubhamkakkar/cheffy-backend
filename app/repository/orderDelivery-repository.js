'use strict';
const { OrderDelivery, User, OrderItem, ShippingAddress, Plates, Order } = require("../models/index");
const path = require('path');
const orderDeliveryConstants = require(path.resolve('app/constants/order-delivery'));
const userConstants = require(path.resolve('app/constants/users'));

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

exports.getDeliveryDetails = async (data) => {
  let orderDelivery = await OrderDelivery.findOne({
    where: {id: data},
    order: [["id", "DESC"]],
    include: [
    {
      model: Order,
      as: 'order',
      include: [
        {
        model: OrderItem,
        attributes: ["plate_id", "chef_location", "name", "description", "amount", "quantity"],
        include:[{
          model: Plates,
          as:'plate',
          include: [{
            model: User,
            as:'chef',
            attributes:userConstants.userSelectFields,
            include:[{model:ShippingAddress, as: 'address'}]
          }]
        }] 
      }
      ]
    }, {
      model: User,
      attributes:userConstants.userSelectFields,
      include:[{model:ShippingAddress, as: 'address'}]
    }]
  });

  orderDelivery = JSON.parse(JSON.stringify(orderDelivery));

  const chef = orderDelivery.order.OrderItems[0].plate.chef;
  orderDelivery.chef = chef;
  delete orderDelivery.order;

  return orderDelivery;

}

exports.getDeliveryChefDetails = async (data) => {
  let orderDelivery = await OrderDelivery.findOne({
    where: { id: data },
    order: [["id", "DESC"]],
    include: [
      {
        model: OrderItem,
        as : 'order_item',
        attributes: ["chef_id","name","description","chef_location","orderId"],
        include: [{
          model: User,
          as: 'chef',
          attributes: ['device_id','device_registration_token'],         
        }]     
      }]
  });

  orderDelivery = JSON.parse(JSON.stringify(orderDelivery));
  
  return orderDelivery;

}
