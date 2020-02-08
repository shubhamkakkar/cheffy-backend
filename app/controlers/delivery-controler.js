"use strict";
const path = require('path');
const HttpStatus = require("http-status-codes");
const {sequelize, User, OrderDelivery } = require('../models/index');
const ValidationContract = require("../services/validator");
const distanceMatrix = require("../services/distance");
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
const walletRepository = require(path.resolve('app/repository/wallet-repository'))
const distance_mat = require('google-distance-matrix');
const matrixKey = require(path.resolve('config/distance')).distance
distance_mat.key (matrixKey.matrixKey) ;
distance_mat.units('metric');
const FCM = require(path.resolve('app/services/fcm'))
const reviews = require(path.resolve('app/models/review'))

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

exports.listCompleteDeliveries = asyncHandler(async (req, res, next) => {
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
})

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
    deliveryType: orderDeliveryConstants.USER_TYPE_DRIVER

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
    let message = message

    const updates = {...req.body};

  //Notify the Cheff
  new NotificationServices()
  .sendPushNotificationToUser(orderDelivery.driverId,
  {
    type: orderDelivery.state_type,
    orderDeliveryId: orderDelivery.id
  }
  );

    await req.orderDelivery.update(updates);

    const orderDelivery = await deliveryRepository.getById(req.orderDelivery.id);

    res.status(HttpStatus.OK).send({message: message || 'Updated', orderDelivery: orderDelivery.get({plain: true})});
});

exports.checkCanceled = asyncHandler(async (req, res, next) => {
    if(req.orderDelivery.state_type === orderDeliveryConstants.STATE_TYPE_CANCELED) {
        return res.status(HttpStatus.BAD_REQUEST).send({message: `OrderDelivery already canceled. orderDeliveryId: ${req.orderDelivery.id}`})
    }
    next();

});

exports.calculateDeliveryTime = asyncHandler(async(req, res, next) => {
  let origins = req.body.origins;
  let destinations = req.body.destinations;
  let mode = req.body.mode;


  // const response = await distanceMatrix.getDistance(origin, destination, mode);

  try{

        /* Default mode is driving, if no mode selected driving will be set as default
        * we can use it as walking, train, bicycle*/

        distance_mat.mode(mode);
        let resp = {};
        distance_mat.matrix(origins, destinations, function (err, distances) {
          if (err) {
            return console.log(err);
          }
          if(!distances) {
            return console.log('no distances');
          }
          if (distances.status == 'OK') {
            for (let i=0; i < origins.length; i++) {
              for (let j = 0; j < destinations.length; j++) {
                let origin = distances.origin_addresses[i];
                let destination = distances.destination_addresses[j];
                if (distances.rows[0].elements[j].status == 'OK') {
                  let distance = distances.rows[i].elements[j].distance.text;
                  let time = distances.rows[i].elements[j].duration.text;
                  resp.distance = distance;
                  resp.time = time;
                  resp.Pickup_address = origin;
                  resp.Delivery_address = destination;
                  return res.status(HttpStatus.ACCEPTED).send({
                              message: 'Success!',
                              data: resp,
                  });


                }
              }
            }
          }
        })
    }catch (e) {
      console.log(e);
      return res.status(HttpStatus.ACCEPTED).send({
                              message: 'Error!',
                              data: null,
                  });
    }




});

exports.calculateDeliveryTime = asyncHandler(async(req, res, next) => {
  let origins = req.body.origins;
  let destinations = req.body.destinations;
  let mode = req.body.mode;

  // const response = await distanceMatrix.getDistance(origin, destination, mode);

  try{
    /* Default mode is driving, if no mode selected driving will be set as default
    * we can use it as walking, train, bicycle*/
    distance_mat.mode(mode);
    let resp = {};
    distance_mat.matrix(origins, destinations, function (err, distances) {
      if (err) {
        return console.log(err);
      }
      if(!distances) {
        return console.log('no distances');
      }
      if (distances.status == 'OK') {
        for (let i=0; i < origins.length; i++) {
          for (let j = 0; j < destinations.length; j++) {
            let origin = distances.origin_addresses[i];
            let destination = distances.destination_addresses[j];
            if (distances.rows[0].elements[j].status == 'OK') {
              let distance = distances.rows[i].elements[j].distance.text;
              let time = distances.rows[i].elements[j].duration.text;
              resp.distance = distance;
              resp.time = time;
              resp.Pickup_address = origin;
              resp.Delivery_address = destination;
              return res.status(HttpStatus.ACCEPTED).send({
                message: 'Success!',
                data: resp,
              });
            }
          }
        }
      }
    })
  } catch (e) {
    console.log(e);
    return res.status(HttpStatus.ACCEPTED).send({
      message: 'Error!',
      data: null,
    });
  }
});

exports.completeDelivery = [
    exports.checkCanceled,
    asyncHandler(async (req, res, next) => {
            req.body.state_type = orderDeliveryConstants.STATE_TYPE_DELIVERED;
            req.body.dropoff_time = sequelize.literal('CURRENT_TIMESTAMP');
            next();
        }),
    exports.editStateType('Delivery Completed!')
];

exports.pickupDelivery = [
    exports.checkCanceled,
    asyncHandler(async (req, res, next) => {
            req.body.state_type = orderDeliveryConstants.STATE_TYPE_PICKED_UP;
            req.body.pickup_time = sequelize.literal('CURRENT_TIMESTAMP');
            next();
        }),
    exports.editStateType('Great! The costumer is waiting for you!')
];

exports.reject = [
    exports.checkCanceled,
    asyncHandler(async (req, res, next) => {
            req.body.state_type = orderDeliveryConstants.STATE_TYPE_REJECTED;
            next();
        }),
    exports.editStateType('Order Delivery Rejected!')
];


exports.accept = [
    exports.checkCanceled,
    asyncHandler(async (req, res, next) => {
            req.body.state_type = orderDeliveryConstants.STATE_TYPE_APPROVED;
            next();
        }),
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

/*************************Order Delivery Status******************************/


exports.acceptOrder = asyncHandler(async (req,res)=>{

    try {

        let status = req.body.state_type
        let userId = req.body.userId

        let details ={
            state_type:orderDeliveryConstants.STATE_TYPE_APPROVED
        }

        await OrderDelivery.update(details, {

            where:{
                userId:userId
            }
        })


        let deviceId = await User.findOne({
            where: {
                userId: userId,
                user_type: userConstants.USER_TYPE_USER
            },
            attributes: ['location_lat', 'location_lon', 'device_id']
        })
        if (deviceId) {
            let details = {  // notification to customer
                orderTitle: 'Order Status',
                orderBrief: `Dear customer your order is  ${status}`,
                activity: "ActivityName",          /*Need's to be set with the name of activity set by android team*/
                device_id: [deviceId.device_id]   /*Need to pass deviceID as an array*/
            }

            await FCM(details)

        } else {
            res.json({
                data:{
                    Message: 'ERROR',
                    Data: `No Device is associated with this id: ${userId}`
                }
            })
        }
    }catch (error) {
        console.log(error)
        res.json({
            code: HttpStatus.BAD_GATEWAY,
            Message: 'Server Error',
        })
    }
})

exports.rejectOrder = asyncHandler(async (req,res)=>{

    try {

        let status = req.body.state_type
        let userId = req.body.userId

        let details ={
            state_type:orderDeliveryConstants.STATE_TYPE_REJECTED
        }

        await OrderDelivery.update(details, {

            where:{
                userId:userId
            }
        })

        let deviceId = await User.findOne({
            where: {
                userId: userId,
                user_type: userConstants.USER_TYPE_USER
            },
            attributes: ['location_lat', 'location_lon', 'device_id']
        })
        if (deviceId) {
            let details = {  // notification to customer
                orderTitle: 'Order Status',
                orderBrief: `Dear customer your order is  ${status}`,
                activity: "ActivityName",          /*Need's to be set with the name of activity set by android team*/
                device_id: [deviceId.device_id]   /*Need to pass deviceID as an array*/
            }

            await FCM(details)

        } else {
            res.json({
                data:{
                    Message: 'ERROR',
                    Data: `No Device is associated with this id: ${userId}`
                }
            })
        }
    }catch (error) {
        console.log(error)
        res.json({
            code: HttpStatus.BAD_GATEWAY,
            Message: 'Server Error',
        })
    }
})

exports.orderReady = asyncHandler(async (req,res)=>{

    try {

        let status = req.body.state_type
        let userId = req.body.userId
        let driverId = req.params.driverId


        let details ={
            state_type:orderDeliveryConstants.STATE_TYPE_PICKED_UP
        }

        await OrderDelivery.update(details, {

            where:{
                userId:userId
            }
        })


        let driverDeviceId = await User.findOne({
            where: {
                userId: driverId,
                user_type: userConstants.USER_TYPE_DRIVER
            },
            attributes: ['location_lat', 'location_lon', 'device_id']
        })

        if(driverDeviceId) {

            /*Notification to Driver*/

            let notificationToDriver = {
                orderTitle: 'Order Delivery',
                orderBrief: `Dear user your order is  ${status}`,
                activity: "ActivityName",                   /*Need's to be set with the name of activity set by android team*/
                device_id: [driverDeviceId.device_id]       /*Need to pass deviceID as an array*/
            }
            await FCM(notificationToDriver)
        }
        let customerDeviceId = await User.findOne({
            where: {
                userId: userId,
                user_type: userConstants.USER_TYPE_USER
            },
            attributes: ['location_lat', 'location_lon', 'device_id']
        })
        if (customerDeviceId) {

            /* notification to customer*/

            let notificationToCustomer = {
                orderTitle: 'Order Delivery',
                orderBrief: `Dear customer your order is  ${status}`,
                activity: "ActivityName",          /*Need's to be set with the name of activity set by android team*/
                device_id: [customerDeviceId.device_id]   /*Need to pass deviceID as an array*/
            }

            await FCM(notificationToCustomer)

        }else {
            res.json({
                data:{
                    Message: 'ERROR',
                    Data: `No Device is associated with this id: ${userId}`
                }

            })
        }
    }catch (error) {
        console.log(error)
        res.json({
            code: HttpStatus.BAD_GATEWAY,
            Message: 'Server Error',
        })
    }
})

exports.orderCompleted = asyncHandler(async (req,res)=>{

    try {

        let status = req.body.state_type
        let userId = req.body.userId


        let details ={
            state_type:orderDeliveryConstants.STATE_TYPE_DELIVERED
        }

        await OrderDelivery.update(details, {

            where:{
                userId:userId
            }
        })

        let deviceId = await User.findOne({
            where: {
                userId: userId,
                user_type: userConstants.USER_TYPE_USER
            },
            attributes: ['location_lat', 'location_lon', 'device_id']
        })
        if (deviceId) {
            let details = {
                orderTitle: 'Order Status',
                orderBrief: `Dear customer your order is  ${status}`,
                activity: "ActivityName",          /*Need's to be set with the name of activity set by android team*/
                device_id: [deviceId.device_id]   /*Need to pass deviceID as an array*/
            }

            await FCM(details)

        } else {
            res.json({
                data:{
                    Message: 'ERROR',
                    Data: `No Device is associated with this id: ${userId}`
                }
            })
        }
    }catch (error) {
        console.log(error)
        res.json({
            code: HttpStatus.BAD_GATEWAY,
            Message: 'Server Error',
        })
    }
})

/***********************Review to chef************************************/

exports.createReview = asyncHandler(async (req,res) =>{

    try {
        let message = req.body.comment
        let rating = req.body.rating
        let reviewDetails ={
            comment: req.body.comment,
            rating:  req.body.rating,
            chefID: req.params.chefID,
            review_type: req.body.review_type,
            review_by: req.body.name
        }

        let createdReview =    await reviews.create(reviewDetails)

        if(createdReview){

            let chefDeviceId =  await User.findOne({
                where: {
                    userId: req.params.chefID,
                    user_type: userConstants.USER_TYPE_CHEF
                },
                attributes: ['device_id']
            })

            if(chefDeviceId){

                /*Notification to Chef*/

                let notificationToChef = {
                    orderTitle: 'Review received',
                    orderBrief: `${message} :Rating: ${rating}`,
                    activity: "ActivityName",                   /*Need's to be set with the name of activity set by android team*/
                    device_id: [chefDeviceId.device_id]       /*Need to pass deviceID as an array*/
                }
                await FCM(notificationToChef)

            }else{
                res.json({
                    data:{
                        Message: 'ERROR',
                        Data: `No Device is associated with this id: ${req.params.chefID}`
                    }
                })
            }
        }else{
            res.json({
                data:{
                    Message: 'ERROR',
                    Data: `No Device is associated with this id: ${req.params.chefID}`
                }
            })
        }

    }catch (e) {
console.log(e)
    }

})


