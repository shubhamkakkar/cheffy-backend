'use strict';
const path = require('path');
const {
  sequelize,
  Plates,
  /*Review,*/
  PlateImage,
  Order,
  ShippingAddress,
  OrderPayment,
  OrderItem,
  OrderDelivery,
  User,
  CustomPlateOrder,
  CustomPlateImage,
  CustomPlate,
  DriverCancellation,
} = require('../models/index');
const orderDeliveryConstants = require(path.resolve(
  'app/constants/order-delivery'
));
const userConstants = require(path.resolve('app/constants/users'));
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

exports.getById = async (orderDeliveryId) => {
  return await OrderDelivery.findByPk(orderDeliveryId);
};

//TODO waiting OrderDelivey to be implemented
exports.createOrderDelivery = async (data) => {
  try {
    const order = await OrderDelivery.create(data);
    return order;
  } catch (e) {
    console.log(e);
    throw e;
  }
};

//TODO waiting OrderDelivey to be implemented
exports.edit = async (data, driver) => {
  // try {
  //     const order = await OrderDelivery.create({...data});
  //     return order;
  //   } catch (e) {
  //     console.log(e)
  //     throw e;
  //   }
};

//TODO waiting OrderDelivey to be implemented
exports.getOrderDeliveriesByUserId = async (data, driver) => {
  return await Order.findAll({
    where: { userId: data },
    order: [["id", "DESC"]],
    include: [
      {
        model: OrderPayment,
        attributes: [
          "amount",
          "client_secret",
          "customer",
          "payment_method",
          "status",
        ],
      },
      {
        model: OrderItem,
        attributes: [
          "plate_id",
          "chef_location",
          "name",
          "description",
          "amount",
          "quantity",
        ],
        include: [
          {
            model: Plates,
            as: "plate",
            include: [
              {
                model: User,
                as: "chef",
              },
              {
                model: PlateImage,
              },
            ],
          },
        ],
      },
      {
        model: OrderDelivery,
        required: true,
        as: "order_delivery",
        attributes: ["id", "state_type"],
        where: {
          [Op.or]: [
            {
              state_type: orderDeliveryConstants.STATE_TYPE_APPROVED,
            },
            {
              state_type: orderDeliveryConstants.STATE_TYPE_DELIVERED,
            },
          ],
        },
      },
    ],
  });
};
//TODO waiting OrderDelivey to be implemented
exports.getOrderDeliveriesPendingByUserId = async (data, driver) => {
  let order = await Order.findAll({
    where: { userId: data },
    order: [["id", "DESC"]],
    include: [
      {
        model: OrderPayment,
        attributes: [
          "amount",
          "client_secret",
          "customer",
          "payment_method",
          "status",
        ],
      },
      {
        model: OrderItem,
        attributes: [
          "plate_id",
          "chef_location",
          "name",
          "description",
          "amount",
          "quantity",
        ],
        include: [
          {
            model: Plates,
            as: "plate",
            include: [
              {
                model: User,
                as: "chef",
              },
              {
                model: PlateImage,
              },
            ],
          },
        ],
      },
      {
        model: OrderDelivery,
        as: "order_delivery",
        required: true,
        attributes: ["id"],
        where: {
          state_type: orderDeliveryConstants.STATE_TYPE_PENDING,
        },
      },
    ],
  });

  return order;
};

exports.getCompletedDeliveriesByUser = async ({ user_id, pagination }) => {
  let order = await Order.findAll({
    where: { userId: user_id },
    ...pagination,
    attributes: [
      "id",
      "basketId",
      "userId",
      "shippingId",
      "state_type",
      "promoCode",
      "total_items",
      "shipping_fee",
      "order_total",
      "createdAt",
      "updatedAt",
    ],
    order: [["id", "DESC"]],
    include: [
      {
        model: OrderPayment,
        attributes: [
          "id",
          "amount",
          "client_secret",
          "customer",
          "payment_method",
          "status",
        ],
      },
      {
        model: OrderItem,
        attributes: [
          "plate_id",
          "chef_location",
          "name",
          "description",
          "amount",
          "quantity",
        ],
        include: [
          {
            model: Plates,
            as: "plate",
            include: [
              {
                model: User,
                as: "chef",
                attributes: userConstants.userSelectFields,
                include: [{ model: ShippingAddress, as: "address" }],
              },

              {
                model: PlateImage,
              },
            ],
          },
        ],
      },
      {
        model: OrderDelivery,
        required: true,
        as: "order_delivery",
        attributes: [
          "id", "rating", "driverId", "pickup_time",
          "dropoff_time", "createdAt", "updatedAt", "has_review",
          'state_type', "orderId", "order_delivery_type", "userId"
          , "delivery_type"
          , "deletedAt"
          , "is_driver_bonus_added"
          , "is_driver_commission_added", "orderItemID"],
        where: {
          state_type: orderDeliveryConstants.STATE_TYPE_DELIVERED,
        },
      },
    ],
  });
  return order;
};

exports.getPendingDeliveriesByUser = async (data) => {
  let order = await Order.findAll({
    where: { userId: data },
    order: [["id", "DESC"]],
    include: [
      {
        model: OrderPayment,
        attributes: [
          "id",
          "amount",
          "client_secret",
          "customer",
          "payment_method",
          "status",
        ],
      },
      {
        model: ShippingAddress,
        as: "shipping",
      },
      {
        model: OrderItem,
        attributes: [
          "plate_id",
          "chef_location",
          "name",
          "description",
          "amount",
          "quantity",
        ],
        include: [
          {
            model: Plates,
            as: "plate",
            include: [
              {
                model: User,
                as: "chef",
                attributes: userConstants.userSelectFields,
                include: [{ model: ShippingAddress, as: "address" }],
              },

              {
                model: PlateImage,
              },
            ],
          },
        ],
      },
      {
        model: OrderDelivery,
        required: true,
        as: "order_delivery",
        where: {
          state_type: orderDeliveryConstants.STATE_TYPE_PENDING,
        },
      },
    ],
  });
  return order;
};

exports.getApprovedDeliveriesByUser = async (data) => {
  let order = await Order.findAll({
    where: { userId: data },
    order: [["id", "DESC"]],
    include: [
      {
        model: OrderPayment,
        attributes: [
          "id",
          "amount",
          "client_secret",
          "customer",
          "payment_method",
          "status",
        ],
      },
      {
        model: ShippingAddress,
        as: "shipping",
      },
      {
        model: OrderItem,
        attributes: [
          "plate_id",
          "chef_location",
          "name",
          "description",
          "amount",
          "quantity",
        ],
        include: [
          {
            model: Plates,
            as: "plate",
            include: [
              {
                model: User,
                as: "chef",
                attributes: userConstants.userSelectFields,
                include: [{ model: ShippingAddress, as: "address" }],
              },

              {
                model: PlateImage,
              },
            ],
          },
        ],
      },
      {
        model: OrderDelivery,
        required: true,
        as: "order_delivery",
        where: {
          state_type: orderDeliveryConstants.STATE_TYPE_APPROVED,
        },
      },
    ],
  });
  return order;
};

exports.getPendingDeliveriesByDriver = async (driverId, data, limit) => {
  try {
    let cancelledOrders = await DriverCancellation.findAll({
      where: { driverId: driverId, isDelivered: 0 },
    });

    cancelledOrders = JSON.parse(JSON.stringify(cancelledOrders));

    const orderIds = cancelledOrders.map(
      (cancelledOrder) => cancelledOrder.orderId
    );

    // Don't include the cancelled order
    let orders = await Order.findAll({
      where: {
        id: orderIds,
      },
      order: [['createdAt', 'ASC']],
      include: [
        {
          model: ShippingAddress,
          as: 'shipping',
        },
        {
          model: OrderItem,
          where: { deliveryType: data.deliveryType },
          attributes: [
            'id',
            'plate_id',
            'customPlateId',
            'item_type',
            'user_id',
            'chef_id',
            'chef_location',
            'name',
            'description',
            'amount',
            'quantity',
            'deliveryType',
          ],
          include: [
            {
              model: Plates,
              as: 'plate',
              include: [
                {
                  model: PlateImage,
                },
                {
                  model: User,
                  as: 'chef',
                  attributes: [
                    'id',
                    'name',
                    'email',
                    'restaurant_name',
                    'location_lat',
                    'location_lon',
                    'user_type',
                    'imagePath'
                  ]
                },
              ],
            },
            {
              model: CustomPlateOrder,
              as: 'custom_plate_order',
              include: [
                {
                  model: CustomPlate,
                  as: 'custom_plate',
                  include: [
                    {
                      model: CustomPlateImage,
                    },
                  ],
                },
              ],
            }
          ],
        }
      ],
    });

    orders = JSON.parse(JSON.stringify(orders));
    // console.log(orders.length)


    // for (var i = 0; i < orders.length; i++) {
    // 	const order = orders[i];
    // 	if (order.OrderItems[0].plate !== null) {
    // 		const chef = order.OrderItems[0].plate.chef;
    // 		order.OrderItems.forEach((orderItem) => {
    // 			delete orderItem.plate.chef;
    // 		});
    // 		order.chef = chef;
    // 	}
    // }

    if (!limit) {
      limit = 1;
    }

    return orders.slice(0, limit);
  }
  catch (error) {
    console.log(error);
    throw error;
  }
};

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
    let returnMainSQL = await sequelize.query(mainSQL, {
      type: sequelize.QueryTypes.SELECT,
      nest: true,
    });

    let deliveryDetails;

    if (returnMainSQL) {
      if (returnMainSQL.length > 0) {
        console.log(JSON.stringify(returnMainSQL));

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

        let retornoChef = await sequelize.query(chefAddressSQL, {
          type: sequelize.QueryTypes.SELECT,
          nest: true,
        });

        if (retornoChef) {
          if (retornoChef.length > 0) {
            console.log(JSON.stringify(retornoChef));
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

        let resultOrderItemsSQL = await sequelize.query(orderItemsSQL, {
          type: sequelize.QueryTypes.SELECT,
          nest: true,
        });

        if (resultOrderItemsSQL) {
          if (resultOrderItemsSQL.length > 0) {
            console.log(JSON.stringify(resultOrderItemsSQL));
            deliveryDetails.order_items = resultOrderItemsSQL;
          }
        }
        return returnMainSQL[0];
      }
    } else {
      return false;
    }
    return deliveryDetails;
  } catch (e) {
    console.log(e);
    throw e;
  }
};

exports.getApprovedDeliveriesByDriver = async (data) => {
  let orderDelivery = await OrderDelivery.findAll({
    where: {
      state_type: {
        [Op.or]: {
          [Op.like]: "%" + orderDeliveryConstants.STATE_TYPE_APPROVED + "%",
          [Op.like]: "%" + orderDeliveryConstants.STATE_TYPE_PICKED_UP + "%",
        }
      },
      driverId: data,
    },
  })

  orderDelivery = JSON.parse(JSON.stringify(orderDelivery));
  const orderDeliveryIds = orderDelivery.map(({ orderId }) => orderId)
  let orders = await Order.findAll({
    order: [["id", "DESC"]],
    where: {
      id: {
        [Op.in]: orderDeliveryIds
      }
    },
    include: [
      {
        model: User,
        as: "user",
        attributes: userConstants.userSelectFields,
      },
      {
        model: OrderPayment,
        attributes: [
          "id",
          "amount",
          "client_secret",
          "customer",
          "payment_method",
          "status",
        ],
      },
      {
        model: ShippingAddress,
        as: "shipping",
      },
      {
        model: OrderItem,
        attributes: [
          "plate_id",
          "chef_location",
          "name",
          "description",
          "amount",
          "quantity",
        ],
        include: [
          {
            model: Plates,
            as: "plate",
            include: [
              {
                model: User,
                as: "chef",
                attributes: userConstants.userSelectFields,
                include: [{ model: ShippingAddress, as: "address" }],
              },

              {
                model: PlateImage,
              },
            ],
          },
        ],
      },
    ],
  });

  orders = JSON.parse(JSON.stringify(orders));


  for (var i = 0; i < orders.length; i++) {
    const order = orders[i];
    if (order.OrderItem.plate !== null) {
      delete order.OrderItem.plate.chef;
      order.chef = chef;
    }
  }

  let temp = orders.map(res => {
    return ({
      ...res,
      order_delivery: orderDelivery.find(orderDeliver => res.id == orderDeliver.orderId)
    })
  })


  return temp

};

exports.getCompleteDeliveriesByDriver = async (data) => {
  let orders = await Order.findAll({
    order: [["id", "DESC"]],
    include: [
      {
        model: User,
        as: "user",
        attributes: userConstants.userSelectFields,
      },
      {
        model: OrderPayment,
        attributes: [
          "id",
          "amount",
          "client_secret",
          "customer",
          "payment_method",
          "status",
        ],
      },
      {
        model: ShippingAddress,
        as: "shipping",
      },
      {
        model: OrderItem,
        attributes: [
          "plate_id",
          "chef_location",
          "name",
          "description",
          "amount",
          "quantity",
        ],
        include: [
          {
            model: Plates,
            as: "plate",
            include: [
              {
                model: User,
                as: "chef",
                attributes: userConstants.userSelectFields,
                include: [{ model: ShippingAddress, as: "address" }],
              },

              {
                model: PlateImage,
              },
            ],
          },
        ],
      },
      {
        model: OrderDelivery,
        required: true,
        as: "order_delivery",
        where: {
          state_type: orderDeliveryConstants.STATE_TYPE_DELIVERED,
          driverId: data,
        },
      },
    ],
  });

  orders = JSON.parse(JSON.stringify(orders));

  for (var i = 0; i < orders.length; i++) {
    const order = orders[i];
    if (order.OrderItems[0].plate !== null) {
      const chef = order.OrderItems[0].plate.chef;
      order.OrderItems.forEach((orderItem) => {
        delete orderItem.plate.chef;
      });
      order.chef = chef;
    }
  }

  return orders;
};
