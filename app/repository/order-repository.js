'use strict';
const {sequelize, Plates, CustomPlate, CustomPlateOrder, PlateReview,PlateImage, CustomPlateImage, Order, ShippingAddress, OrderPayment, OrderItem,OrderDelivery, User } = require("../models/index");

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
      const order = await OrderItem.findByPk(orderItemId);
      return order;
    } catch (e) {
      console.log(e)
      throw e;
    }
}


exports.getOrderItemByIdDetails = async (orderItemId) => {
  const order = await OrderItem.findByPk(orderItemId, {
    include:[{
      model: Plates,
      as:'plate',
      include: [{
        model: User,
        as:'chef'
      },
      {
        model: PlateImage
      }]
    },{
      model: CustomPlateOrder,
      as:'custom_plate_order',
      include: [{
        model: User,
        as:'user'
      },{
        model: CustomPlate,
        as:'custom_plate',
        include: [{
          model: CustomPlateImage
        }]
      }]
    }]
  });

  return order;
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
        attributes: ["id", "plate_id", "customPlateId", "item_type", "chef_location", "name", "description", "amount", "quantity"],
        include:[{
          model: Plates,
          as:'plate',
          include: [{
            model: User,
            as:'chef'
          },
          {
            model: PlateImage
          }]
        },{
          model: CustomPlateOrder,
          as:'custom_plate_order',
          include: [{
            model: User,
            as:'user'
          },{
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

exports.getUserOrdersBeingDelivered  = async (data) => {
  let order = await Order.findAll({
    where: {userId:data},
    order: [["id", "DESC"]],
    include: [
      {
        model: OrderPayment,
        attributes: ["payment_id", "amount", "client_secret", "customer", "payment_method", "status"]
      },
      {
        model: OrderItem,
        attributes: ["plate_id", "customPlateId", "item_type", "chef_location", "name", "description", "amount", "quantity"],
        include:[{
          model: Plates,
          as:'plate',
          include: [{
            model: User,
            as:'chef'
          },
          {
            model: PlateImage
        }]
        },{
          model: CustomPlateOrder,
          as:'custom_plate_order',
          include: [{
            model: User,
            as:'user'
          },{
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
    attributes: ["id"]
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
        attributes: ["payment_id", "amount", "client_secret", "customer", "payment_method", "status"]
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

    createdReview  = await PlateReview.create(review);

    if(createdReview){
      let orderDelivery = OrderDelivery.findOne({where:{orderId:orderItem.orderId}});
      if(orderDelivery){
        orderDelivery.rating = createdReview.rating;
        orderDelivery.has_rating = true;
        orderDelivery.save();
      }
    }


    return await sequelize.query(`SELECT (sum(rating)/ count(rating)) as average_rating FROM PlateReviews where plateId=${plateId}`).then(([results, metadata]) => {

      let average_rating = createdReview.rating;

      if(results.lehgth > 0){
        average_rating = results[0].average_rating;
      }


      try {

      return Plates.update(
        { rating: average_rating },
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
