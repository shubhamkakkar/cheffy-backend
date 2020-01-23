'use strict';
const {sequelize, Plates,AggregateReview, CustomPlate, CustomPlateOrder, Review,PlateImage, CustomPlateImage, Order, ShippingAddress, OrderPayment, OrderItem,OrderDelivery, User } = require("../models/index");
const path = require('path');
const userConstants = require(path.resolve('app/constants/users'));
const orderItemConstants = require(path.resolve('app/constants/order-item'));
const reviewConstants = require(path.resolve('app/constants/reviews'));


exports.getById = async (orderId) => {
    try {
        const order = await Order.findByPk(orderId);

        return order;
      } catch (e) {
        console.log(e)
        throw e;
      }

  }

exports.getOrderItemById = async (orderItemId) => {
  try {
      const order = await OrderItem.findByPk(orderItemId,{
        attributes:{
          exclude:['WalletId']
        }


      });
      return order;
    } catch (e) {
      console.log(e)
      throw e;
    }
}


exports.getOrderItemByIdDetails = async (orderItemId) => {

  const orderItem = await OrderItem.findByPk(orderItemId, {
    attributes: orderItemConstants.selectFields,
    include:[{
        model: User,
        foreignKey: 'user_id',
        as:'user',
        attributes: userConstants.userSelectFields
      },{
        model: User,
        foreignKey: 'chef_id',
        as:'chef',
        attributes: userConstants.userSelectFields
      },{
      model: Plates,
      as:'plate',
      include: [{
        model: PlateImage
      }]
      },{
      model: CustomPlateOrder,
      as:'custom_plate_order',
      include: [{
        model: CustomPlate,
        as:'custom_plate',
        include: [{
          model: CustomPlateImage
        }]
      }]
    }]
  });
  return orderItem;
}


exports.createOrderItem = async(data) => {
  return await OrderItem.create(data);
}

/**
* TODO use bulk create in future
* my bulk create implementation was not creating orderitems
*/
exports.createOrderItems = async(dataArray) => {
//  return await OrderItem.bulkCreate(dataArray);
console.log(dataArray);
  const orderItems = dataArray.map(async(data) => {
    return await exports.createOrderItem(data);
  });

  return Promise.all(orderItems);
}

exports.editOrder = async (orderId,data) => {
    try {
        const order = await Order.findByPk(orderId);
        order.userId = data.userId;

        if(typeof data.basketId !== 'undefined'){
          order.basketId = data.basketId;
        }

        if(typeof data.state_type !== 'undefined'){
          order.state_type = data.state_type;
        }

        if(typeof data.total_items !== 'undefined'){
          order.total_items = data.total_items;
        }

        if(typeof data.shipping_fee !== 'undefined'){
          order.shipping_fee = data.shipping_fee;
        }

        if(typeof data.order_total !== 'undefined'){
          order.order_total = data.order_total;
        }

        await order.save();
        return order;
      } catch (e) {
        console.log(e)
        throw e;
      }

}

exports.create = async (data) => {
  let doc = await Order.create({ ...data });
  return doc;
}

exports.editState = async (data, state) => {
  let order = await Order.findByPk(data);
  order.state_type = state;
  await order.save();
  return order;
}

/**
* Main Table: Orders
*List user orders
* User orders are contained in orders table with respective items in orderitems table referenced to orderId
*/
exports.getUserOrders = async (data) => {
  let order = await Order.findAll({
    where: { userId: data },
    order: [["id", "DESC"]],
    include: [
      {
        model: OrderPayment,
        attributes: ["id", "amount", "client_secret", "customer", "payment_method", "status"]
      },
      {
        model: OrderItem,
        attributes: ["id", "plate_id", "customPlateId", "user_id", "chef_id", "item_type", "chef_location", "name", "description", "amount", "quantity"],
        include:[{
          model: Plates,
          as:'plate',
          include: [{
            model: PlateImage
          }]
        },{
          model: CustomPlateOrder,
          as:'custom_plate_order',
          include: [{
            model: CustomPlate,
            as:'custom_plate',
            include: [{
              model: CustomPlateImage
            }]
          }]
      }]
    }]
  });
  return order;
}

exports.listTrackingUser  = async (data) => {
  let order = await Order.findAll({
    where: {userId:data},
    order: [["id", "DESC"]],
    include: [
      {
        model: OrderPayment,
        attributes: ["id", "amount", "client_secret", "customer", "payment_method", "status"]
      },
      {
        model: ShippingAddress,
        attributes: ["id", "addressLine1", "addressLine2", "city", "state", "zipCode","lat", "lon"],
        as:'shipping'
      },
      {
        model: OrderItem,
        attributes: ["id","plate_id", "customPlateId", "item_type", "user_id", "chef_id", "chef_location", "name", "description", "amount", "quantity", "deliveryType"],
        include:[
        {
          model: User,
          as: 'chef',
          attributes: userConstants.userSelectFields

        },
        {
          model: Plates,
          as:'plate',
          include: [
          {
            model: PlateImage
        }]
        },{
          model: CustomPlateOrder,
          as:'custom_plate_order',
          include: [{
            model: CustomPlate,
            as:'custom_plate',
            include: [
            {
              model: CustomPlateImage
            }]
          }]
      }]
    },
    {
    model: OrderDelivery,
    required: true,
    attributes: ["id","state_type"]
  }]
  });
  return order;
}

exports.listTrackingDriver  = async (data) => {
    let order = await Order.findAll({
    order: [["id", "DESC"]],
    include: [
      {
        model: OrderPayment,
        attributes: ["id", "amount", "client_secret", "customer", "payment_method", "status"]
      },
      {
        model: ShippingAddress,
        attributes: ["id", "addressLine1","lat", "lon", "addressLine2", "city", "state", "zipCode"],
        as:'shipping'
      },
      {
        model: OrderItem,
        attributes: ["id","plate_id", "customPlateId", "item_type", "user_id", "chef_id", "chef_location", "name", "description", "amount", "quantity", "deliveryType"],
        include:[
        {
          model: User,
          as: 'chef',
          attributes: userConstants.userSelectFields

        },

        {
          model: Plates,
          as:'plate',
          include: [
          {
            model: PlateImage
        }]
        },{
          model: CustomPlateOrder,
          as:'custom_plate_order',
          include: [{
            model: CustomPlate,
            as:'custom_plate',
            include: [
            {
              model: CustomPlateImage
            }]
          }]
      }]
    },
    {
    model: OrderDelivery,
    required: true,
    attributes: ["id","state_type"],
    where: {driverId:data},
  }]
  });
  return order;
}

exports.getUserOrder = async (data, id) => {
  let order = await Order.findOne({
    where: { userId: data, id: id },
    include: [
      {
        model: OrderPayment,
        attributes: ["id", "amount", "client_secret", "customer", "payment_method", "status"]
      },
      {
        model: OrderItem,
        attributes: ["plate_id","customPlateId", "item_type", "chef_location", "name", "description", "amount", "quantity"]
      },
    ]
  });
  return order;
}

exports.user = async (data) => {
  try {
    const existUser = await User.findByPk(data);
    return existUser;
  } catch (e) {
    return { message: "Erro to return user!", error: e}
  }
}

exports.userLocation = async (data) => {
  try {
    const existUser = await ShippingAddress.findOne({
      where: { userId: data }
    }, {
      attributes: [ 'addressLine1', 'addressLine2', 'state', 'city', 'zipCode' ],
    });
    return existUser;
  } catch (e) {
    return { message: "Erro to return user!", error: e}
  }
}


exports.createOrderReview = async (review) => {
  let orderItem, plate,createdReview;
  try{

    try {
      orderItem = await OrderItem.findByPk(review.orderItemId,{attributes:['plate_id']});
      if(!orderItem){
        throw Error("Plate not found");
      }
    } catch (error) {
      throw error;
    }

    let plateId = orderItem.plate_id;
    review.plateId = plateId;

    createdReview  = await Review.create(review);

    /*if(createdReview){
      let orderDelivery = OrderDelivery.findOne({where:{orderId:orderItem.orderId}});console.log(orderDelivery)
      if(orderDelivery){
        orderDelivery.rating = createdReview.rating;
        orderDelivery.has_rating = true;
        orderDelivery.save();
      }
    }*/


    let sumUser = await Review.count({

      where:{plateId:plateId}

    })

    let sumRating = await Review.sum('rating', {

      where:{plateId:plateId}

    })

    let aggr_item = {};
    aggr_item.review_type = reviewConstants.REVIEW_TYPE_PLATE;
    aggr_item.plateId = plateId;
    aggr_item.userCount = sumUser;
    aggr_item.rating = (sumRating/sumUser).toFixed(1);


    const foundPlate = await AggregateReview.findOne({where:{plateId:plateId}});
    if (!foundPlate) {
        await AggregateReview.create(aggr_item)
      }
    else await AggregateReview.update(aggr_item, {where:{plateId:plateId}});

    return await sequelize.query(`SELECT (sum(rating)/ count(rating)) as average_rating FROM Reviews where plateId=${plateId}`).then(([results, metadata]) => {

      let average_rating = createdReview.rating;

      if(results.length > 0){
        average_rating = results[0].average_rating;
      }


      try {

      return Plates.update(
        { rating: average_rating.toFixed(1) },
        { where: {id:plateId } }
      )

      } catch (error) {
        throw error;
      }

    }).then(function(retorno){
      return createdReview;
    });


  } catch (e) {
  console.log("Error: ", e);
  return { message: "Fail to get Plate Reviews!", error: e };

  }
}

exports.getOrdersReadyDelivery = async (data) => {
  try {
    const orders_ready = await Order.findAll({
      where: { state_type: 5 },
      include: [
        {
          model: ShippingAddress,
          as: 'shipping',
          attributes: ['lat', 'lon']
        }
      ]
    });
    console.log(orders_ready);
    return orders_ready;
  } catch (e) {
    console.log(e)
    return { message: "Erro to return orders!", error: e}
  }
};

/**
* Main Table: OrderItems
* Get chef orders
* Chef user orders are in order items table instead of orders because a user can order from multiple chef,
* so it's not necessary that a wole order can contain the same chef.
*/
exports.getChefOrders = async({chef_id, state_type, pagination}) => {
  const whereQuery = {chef_id};
  if(state_type) {
    whereQuery.state_type = state_type;
  }

  return OrderItem.findAll({where: whereQuery, ...pagination,
    attributes: orderItemConstants.selectFields,
    include:[{
      model: User,
      as:'user',
      attributes: userConstants.userSelectFields
    },{
      model: Plates,
      as:'plate',
      include: [{
          model: PlateImage
      }]
    },{
      model: CustomPlateOrder,
      as:'custom_plate_order',
      include: [{
        model: CustomPlate,
        as:'custom_plate',
        include: [
        {
          model: CustomPlateImage
        }]
      }]
    }]
  });

};

/**
* Main Table: OrderItems and OrderDeliveries
* Get user OrderItems with OrderDelivery info if exists
*/
exports.getOrderItemsWithRespectiveDelivery = async({user_id, state_type, pagination}) => {
  const whereQuery = {user_id};

  if(state_type) {
    whereQuery.state_type = state_type;
  }

  return OrderItem.findAll({where: whereQuery, ...pagination,
    attributes: orderItemConstants.selectFields,
    include:[{
      model: OrderDelivery,
      //left outer join with OrderDelivery
      //show all records of orderitem and existing orderdelivery of that orderitem of a particular user
      required: false
    },{
      model: Plates,
      as:'plate',
      include: [{
          model: PlateImage
      }]
    },{
      model: CustomPlateOrder,
      as:'custom_plate_order',
      include: [{
        model: CustomPlate,
        as:'custom_plate',
        include: [
        {
          model: CustomPlateImage
        }]
      }]
    }]
  });
}
