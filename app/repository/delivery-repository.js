'use strict';
const path = require('path');
const {sequelize, Plates, PlateReview,PlateImage, Order, ShippingAddress, OrderPayment, OrderItem,OrderDelivery, User } = require("../models/index");
const orderDeliveryConstants = require(path.resolve('app/constants/order-delivery'));


exports.getById = async (orderDeliveryId) => {
  return await OrderDelivery.findByPk(orderDeliveryId);
};


//TODO waiting OrderDelivey to be implemented
exports.createOrderDelivery = async (orderId) => {
    try {
        const order = await OrderDelivery.create({
          orderId:orderId,
          state_type:'pending'});
        return order;
      } catch (e) {
        console.log(e)
        throw e;
      }

  }



//TODO waiting OrderDelivey to be implemented
exports.edit = async (data,driver) => {
    // try {
    //     const order = await OrderDelivery.create({...data});
    //     return order;
    //   } catch (e) {
    //     console.log(e)
    //     throw e;
    //   }

  }

  //TODO waiting OrderDelivey to be implemented
exports.getOrderDeliveriesByUserId = async (data,driver) => {
  let order = await Order.findAll({
    where: {userId:data},
    order: [["id", "DESC"]],
    include: [
      {
        model: OrderPayment,
        attributes: ["amount", "client_secret", "customer", "payment_method", "status"]
      },
      {
        model: OrderItem,
        attributes: ["plate_id", "chef_location", "name", "description", "amount", "quantity"],
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
      }]
    },
    {
    model: OrderDelivery,
    required: true,
    attributes: ["id"],
    //where: {state_type: 'pending'}
   }]
  });

  return order;
}
  //TODO waiting OrderDelivey to be implemented
exports.getOrderDeliveriesPendingByUserId = async (data,driver) => {
  let order = await Order.findAll({
    where: {userId:data},
    order: [["id", "DESC"]],
    include: [
      {
        model: OrderPayment,
        attributes: ["amount", "client_secret", "customer", "payment_method", "status"]
      },
      {
        model: OrderItem,
        attributes: ["plate_id", "chef_location", "name", "description", "amount", "quantity"],
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
      }]
    },
    {
    model: OrderDelivery,
    required: true,
    attributes: ["id"],
    where: {state_type: orderDeliveryConstants.STATE_TYPE_PENDING}
   }]
  });

  return order;
}

exports.getCompletedDeliveriesByUser = async (data) => {
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
        attributes: ["plate_id", "chef_location", "name", "description", "amount", "quantity"],
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
      }]
    },
    {
    model: OrderDelivery,
    required: true,
    attributes: ["id"],
    where: {state_type: orderDeliveryConstants.STATE_TYPE.STATE_TYPE_DELIVERED}
   }]
  });
  return order;

}


exports.getPendingDeliveriesByUser = async (data) => {
  let order = await Order.findAll({
    where: {userId:data},
    order: [["id", "DESC"]],
    include: [
      {
        model: OrderPayment,
        attributes: ["id", "amount", "client_secret", "customer", "payment_method", "status"]
      },

      {
        model: OrderItem,
        attributes: ["plate_id", "chef_location", "name", "description", "amount", "quantity"],
        include:[{
          model: Plates,
          as:'plate',
          include: [{
            model: User,
            as:'chef',
            include:[{model:ShippingAddress, as: 'address'}]

          },

          {
            model: PlateImage
        }]
      }]
    },
    {
    model: OrderDelivery,
    required: true,
    attributes: ["id"],
    where: {state_type: orderDeliveryConstants.STATE_TYPE.STATE_TYPE_PENDING}
   }]
  });
  return order;

}


  //TODO waiting OrderDelivey to be implemented
  exports.getByIdDetails = async (data) => {
    try {
      let deliveryId = parseInt(data);

        let mainSQL = `SELECT
                        o.id,
                        o.basketId,
                        o.state_type,
                        o.shipping_fee,
                        o.order_total,
                        o.createdAt,
                        o.updatedAt,
                        null as "pickup_addresses",
                        s.addressLine1 as "shipping_address.addressLine1",
                        s.addressLine2 as "shipping_address.addressLine2",
                        s.city as "shipping_address.city",
                        s.state as "shipping_address.state",
                        s.zipCode as "shipping_address.zip_code",
                        s.lat as "shipping_address.lat",
                        s.lon as "shipping_address.lon",
                        null as "order_items"
                        FROM Orders o
                        inner join ShippingAddresses s
                        on(o.shippingId = s.id) where o.id = ${deliveryId}`;

                        mainSQL = mainSQL.replace(/"/g, "`");
          let returnMainSQL = await sequelize.query(mainSQL,{type: sequelize.QueryTypes.SELECT,nest: true});

          let deliveryDetails;

          if(returnMainSQL){
            if(returnMainSQL.length > 0){
              console.log(JSON.stringify(returnMainSQL))

              deliveryDetails = returnMainSQL[0];
              let shippingLat = deliveryDetails.shipping_address.lat;
              let shippingLong = deliveryDetails.shipping_address.lon;

              let chefAddressSQL = `
                      SELECT
                      od.id,
                      od.orderId,
                      p.userId as chefId,
                        u.name as chefName,
                        sh.id,sh.addressLine1,
                        ( 3959 * acos( cos( radians(${shippingLat}) ) * cos( radians( sh.lat ) ) * cos( radians( sh.lon ) - radians(${shippingLong}) ) + sin( radians(${shippingLat}) ) * sin(radians(sh.lat)) ) ) AS distance,
                        sh.addressLine2,
                        sh.state,
                        sh.zipCode,
                        sh.lat,
                        sh.lon FROM OrderDeliveries od
                    inner join OrderItems oi
                    on (od.orderId = oi.orderId)
                    inner join Plates p
                    on (p.id = oi.plate_id)
                    inner join ShippingAddresses sh
                    on (sh.userId = p.userId)
                    inner join Users u
                    on (p.userId = u.id)

                    where od.id = ${deliveryId}`;

              let retornoChef = await sequelize.query(chefAddressSQL,{type: sequelize.QueryTypes.SELECT,nest: true});

              if(retornoChef){
                if(retornoChef.length > 0){
                  console.log(JSON.stringify(retornoChef))
                  deliveryDetails.pickup_addresses = retornoChef;
                }
              }
              let orderId = retornoChef[0].orderId;
              let orderItemsSQL = `SELECT
                                      p.userId as chefId,
                                        u.name as chefName,
                                        oi.*
                                      FROM OrderItems oi

                                    inner join Plates p
                                    on (p.id = oi.plate_id)
                                    inner join ShippingAddresses sh
                                    on (sh.userId = p.userId)
                                    inner join Users u
                                    on (p.userId = u.id)

                                    where oi.orderId = ${orderId}`;

                let resultOrderItemsSQL = await sequelize.query(orderItemsSQL,{type: sequelize.QueryTypes.SELECT,nest: true});

                if(resultOrderItemsSQL){
                  if(resultOrderItemsSQL.length > 0){
                    console.log(JSON.stringify(resultOrderItemsSQL))
                    deliveryDetails.order_items = resultOrderItemsSQL;
                  }
                }
              return returnMainSQL[0];
            }

        }else{
          return false
        }
        return deliveryDetails;
      } catch (e) {
        console.log(e)
        throw e;
      }

  }
