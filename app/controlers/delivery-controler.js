'use strict';
const path = require('path');
const HttpStatus = require('http-status-codes');
const {
	sequelize,
	User,
	OrderDelivery,
	Order,
	/*Notification,*/
	OrderItem,
} = require('../models/index');
const ValidationContract = require('../services/validator');
const orderRepository = require('../repository/order-repository');
const deliveryRepository = require('../repository/delivery-repository');
const orderDeliveryRepository = require('../repository/orderDelivery-repository');
/*const demandService = require('../services/demands');
const authService = require('../services/auth');*/
//const FCM = require(path.resolve('app/services/fcm'));
const userConstants = require(path.resolve('app/constants/users'));
const asyncHandler = require('express-async-handler');
const orderDeliveryConstants = require(path.resolve(
	'app/constants/order-delivery'
));
const paginator = require(path.resolve('app/services/paginator'));
const appConfig = require(path.resolve('config/app'));
const shippingAddressConstants = require(path.resolve(
	'app/constants/shipping-address'
));
const utils = require(path.resolve('app/utils'));
const walletRepository = require(path.resolve(
	'app/repository/wallet-repository'
));
const distance_mat = require('google-distance-matrix');
const matrixKey = require(path.resolve('config/distance')).distance;
const notificationService = require(path.resolve('app/services/notification'));
const notificationConstant = require(path.resolve(
	'app/constants/notification'
));
const repositoryUser = require(path.resolve('app/repository/user-repository'));
const policyHelpers = require(path.resolve('app/policies/helpers'));
const middlewares = require(path.resolve('./server/middlewares'));

const _ = require('underscore');
distance_mat.key(matrixKey.matrixKey);
distance_mat.units('metric');

exports.isAdminMiddleware = (app) => {
	return [
	  middlewares.authorization((req) => {
		return policyHelpers.isAdmin(req);
	  })
	];
  };

exports.orderDeliveryByIdMiddleware = asyncHandler(
	async (req, res, next, orderDeliveryId) => {
		console.info(req);
		const orderDelivery = await deliveryRepository.getById(orderDeliveryId);
		if (!orderDelivery)
			return res.status(HttpStatus.NOT_FOUND).send({
				message: `Order Delivery Not Found by id ${orderDeliveryId}`,
			});
		req.orderDelivery = orderDelivery;

		next();
	}
);

//Is this the pending deliveries of a user
exports.list = asyncHandler(async (req, res, next) => {
	const userId = req.userId;
	const user = await User.findOne({ where: { id: userId } });

	if (
		user.user_type !== userConstants.USER_TYPE_DRIVER &&
		user.user_type !== userConstants.USER_TYPE_CHEF
	) {
		return res
			.status(HttpStatus.CONFLICT)
			.send({
				message: 'Only drivers and cheffs can have deliveries',
				error: true,
			})
			.end();
	}

	let deliveries = await deliveryRepository.getOrderDeliveriesByUserId(
		user.id
	);

	if (!deliveries) {
		return res.status(HttpStatus.CONFLICT).send({
			message: "we couldn't find the user's deliveries",
			status: HttpStatus.CONFLICT,
		});
	}

	let payload = {};

	(payload.message = 'Here are your orders!'), (payload.data = deliveries);
	res.status(HttpStatus.OK).send(payload);
});

exports.calculateDeliveryTime = async (req, res, next) => {
	let origins = req.body.origins;
	let destinations = req.body.destinations;
	let mode = req.body.mode;

	// const response = await distanceMatrix.getDistance(origin, destination, mode);

	try {
		/* Default mode is driving, if no mode selected driving will be set as default
		 * we can use it as walking, train, bicycle*/

		distance_mat.mode(mode);
		let resp = {};
		distance_mat.matrix(origins, destinations, function (err, distances) {
			if (err) {
				return console.log(err);
			}
			if (!distances) {
				return console.log('no distances');
			}
			if (distances.status == 'OK') {
				for (let i = 0; i < origins.length; i++) {
					for (let j = 0; j < destinations.length; j++) {
						let origin = distances.origin_addresses[i];
						let destination = distances.destination_addresses[j];
						if (distances.rows[0].elements[j].status == 'OK') {
							let distance =
								distances.rows[i].elements[j].distance.text;
							let time =
								distances.rows[i].elements[j].duration.text;
							resp.distance = distance;
							resp.time = time;
							resp.Pickup_address = origin;
							resp.Delivery_address = destination;
							return res.status(HttpStatus.OK).send({
								message: 'Success!',
								data: resp,
							});
						}
						else if(distances.rows[0].elements[j].status == 'ZERO_RESULTS'){
							return res.status(HttpStatus.CONFLICT).send({
								message: 'Error! Wrong coordinates specified',
								data: null,
							});
						}
					}
				}
			}
		});
	} catch (e) {
		return res.status(HttpStatus.CONFLICT).send({
			message: 'Error!',
			data: e,
		});
	}
};

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
	try {
		const pagination = paginator.paginateQuery(req);
		const query = { user_id: req.userId, pagination };
		const user_orders = await deliveryRepository.getCompletedDeliveriesByUser(
			query
		);
		res.status(HttpStatus.OK).send({
			message: 'Here are your orders!',
			data: user_orders,
			...paginator.paginateInfo(pagination),
		});
		return 0;
	} catch (e) {
		console.log(e);
		res.status(HttpStatus.CONFLICT).send({
			message: 'Fail to get your orders!',
			error: true,
		});
		return 0;
	}
};

exports.listPendingDeliveries = asyncHandler(async (req, res, next) => {
	try {
		const user_orders = await deliveryRepository.getPendingDeliveriesByUser(
			req.userId
		);
		res.status(HttpStatus.OK).send({
			message: 'Here are your orders!',
			data: user_orders,
		});
		return 0;
	} catch (e) {
		console.log(e);
		res.status(HttpStatus.CONFLICT).send({
			message: 'Fail to get your orders!',
			error: true,
		});
		return 0;
	}
});

exports.listApprovedDeliveries = asyncHandler(async (req, res, next) => {
	try {
		const user_orders = await deliveryRepository.getApprovedDeliveriesByUser(
			req.userId
		);
		res.status(HttpStatus.OK).send({
			message: 'Here are your orders!',
			data: user_orders,
		});
		return 0;
	} catch (e) {
		console.log(e);
		res.status(HttpStatus.CONFLICT).send({
			message: 'Fail to get your orders!',
			error: true,
		});
		return 0;
	}
});

exports.listPendingDeliveriesDriver = asyncHandler(async (req, res, next) => {
	try {
		const pagination = paginator.paginateQuery(req);
		const query = { deliveryType: userConstants.USER_TYPE_DRIVER, pagination };
	 	const driver_pending_orders = await deliveryRepository.getPendingDeliveriesByDriver(
			req.userId,
			query,
			req.body.limit
		);
		res.status(HttpStatus.OK).send({
			message: 'Here are your orders!',
			data: driver_pending_orders,
			...paginator.paginateInfo(query),
		});
	}
	catch (e) {
		 console.log(e);
		res.status(HttpStatus.CONFLICT).send({
			message: 'Fail to get your orders!',
			error: e,
		});
		return 0;
	}
});

exports.createDelivery = asyncHandler(async (req, res, next) => {
	let contract = new ValidationContract();
	contract.isRequired(req.params.orderId, 'The order ID is required!');

	if (!contract.isValid()) {
		return res.status(HttpStatus.CONFLICT).send(contract.errors()).end();
	}

	let createdOrderDelivery;

	createdOrderDelivery = await OrderDelivery.findOne({
		where: { orderId: req.params.orderId },
	});

	if (!createdOrderDelivery) {
		const existUser = req.user;
		const user_order = await Order.findOne({
			where: { id: req.params.orderId },
		});

		const payload = {
			orderId: user_order.id,
			order_delivery_type: orderDeliveryConstants.DELIVERY_TYPE_ORDER,
			userId: user_order.userId,
			driverId: req.userId,
			state_type: orderDeliveryConstants.STATE_TYPE_PENDING,
			delivery_type: orderDeliveryConstants.DELIVERY_TYPE_DRIVER,
		};

		if (req.body.pickup_time) {
			payload.pickup_time = req.body.pickup_time;
		}

		if (req.body.dropoff_time) {
			payload.dropoff_time = req.body.dropoff_time;
		}

		createdOrderDelivery = await deliveryRepository.createOrderDelivery(
			payload
		);
	}

	//demandService.sendToDelivery(orderId,loc,shipping)

	let response = {};
	response.status = HttpStatus.CREATED;
	response.orderDelivery = createdOrderDelivery;
	res.status(response.status).send(response);
});

exports.editStateType = (message) =>
	asyncHandler(async (req, res, next) => {
		const user = req.user;

		const updates = { ...req.body };

		await req.orderDelivery.update(updates);

		const orderDelivery = await deliveryRepository.getById(
			req.orderDelivery.id
		);

		const existUser = await User.findOne({
			where: { id: req.orderDelivery.userId },
		});

		//  const chefOrderDelivery = await orderDeliveryRepository.getDeliveryChefDetails(req.orderDelivery.id);

		//const chef = chefOrderDelivery.order_item.chef;

		const flag = { order_flag: false };

		await existUser.update(flag);

		res.status(HttpStatus.OK).send({
			message: message || 'Updated',
			orderDelivery: orderDelivery.get({ plain: true }),
		});

		next();
		/* let device_id = []
  let device_registration_tokens = [];
  device_id.push(chef.device_id);
  device_registration_tokens.push(chef.device_registration_token);
  //Notify the Cheff
  let pushnotification = {
    orderTitle:  `Order ${chefOrderDelivery.order_item.name} delivered`,
    orderBrief: `Order ${chefOrderDelivery.order_item.description} delivred in location ${chefOrderDelivery.order_item.chef_location}`,
    activity: orderDeliveryConstants.STATE_TYPE_DELIVERED,
    device_id: device_id,
    device_registration_tokens: device_registration_tokens
  };
  
  await FCM(pushnotification).then((response) => {
      console.log(response);
  });

  var noti = {
    userId: req.orderDelivery.userId,
    timestamp: sequelize.literal('CURRENT_TIMESTAMP'),
    state_type: notificationConstants.NOTIFICATION_TYPE_SENT,
    orderTitle: `Order ${chefOrderDelivery.order_item.name} delivered`,
    orderBrief: `Order ${chefOrderDelivery.order_item.description} delivred in location ${chefOrderDelivery.order_item.chef_location}`,
    activity: orderDeliveryConstants.STATE_TYPE_DELIVERED,
    device_id : chef.device_id,
    order_id : chefOrderDelivery.order_item.orderId,
  }

  await Notification.create(noti); */
	});

exports.checkCanceled = (req, res, next) => {
	if (
		req.orderDelivery.state_type ===
		orderDeliveryConstants.STATE_TYPE_CANCELED
	) {
		return res.status(HttpStatus.BAD_REQUEST).send({
			message: `OrderDelivery already canceled. orderDeliveryId: ${req.orderDelivery.id}`,
		});
	}
	next();
};

exports.addMoneyToWallet = async (req, res, next) => {
	const driverId = req.user.id;

	const order = await Order.findOne({
		where: { id: req.orderDelivery.orderId },
		attributes: ['order_total'],
	});

	const orderAmount = order.order_total;
	
	await walletRepository.addDriversMoneyToWallet(driverId, orderAmount);
	next();
};

exports.addDriverBonusToWallet = asyncHandler(async (req, res, next) => {
	//debug('req.body', JSON.stringify(req.body));

	let contract = new ValidationContract();
	const { driverId, amount  } = req.body;

	contract.isRequired(req.body.driverId, 'Driver ID is required!');
	contract.isRequired(req.body.amount, 'Amount is required!');

	if (!contract.isValid()) {
		res.status(HttpStatus.CONFLICT).send(contract.errors()).end();
		return 0;
	}

	if(req.orderDelivery && req.orderDelivery.is_driver_bonus_added) {
		res.status(HttpStatus.BAD_REQUEST).send({
			message: 'Driver bonus already added',
		});
		return 0;
	}

	if(!req.orderDelivery) {

		let deliveyWithoutBonus = OrderDelivery.findOne({ where: { 
			is_driver_bonus_added : 0,
			driverId :  driverId
		}}); 
		
		if(!deliveyWithoutBonus) {
			res.status(HttpStatus.BAD_REQUEST).send({
				message: 'Driver bonus already added for last deliveries',
			});
			return 0;
		}
	}

	await walletRepository.addTipToWallet(driverId, Number(amount));

	if(req.orderDelivery) {
		req.orderDelivery.is_driver_bonus_added = 1;
		req.orderDelivery.save();
	} else {
		OrderDelivery.update({ is_driver_bonus_added : 1 }, { 
			where : { 
				driverId :  driverId
			}
		}); 
	}

	res.status(HttpStatus.OK).send({
		message: 'Driver bonus added',
	});
});

exports.addDriverCommissionToWallet = async (req, res, next) => {
	const driverId = req.user.id;

	const order = await Order.findOne({
		where: { id: req.orderDelivery.orderId },
		attributes: ['order_total'],
	});

	const orderAmount = order.order_total;
	
	if(req.orderDelivery.is_driver_commission_added) {
		return res.status(HttpStatus.BAD_REQUEST).send({
			message: 'Driver commission already added',
		});
		return 0;
	}

	await walletRepository.addDriversMoneyToWallet(driverId, orderAmount);

	req.body.is_driver_commission_added = true;

	next();
};

exports.completeDelivery = [
	exports.checkCanceled,
	(req, res, next) => {
		req.body.state_type = orderDeliveryConstants.STATE_TYPE_DELIVERED;
		req.body.dropoff_time = sequelize.literal('CURRENT_TIMESTAMP');
		next();
	},
	exports.addDriverCommissionToWallet,
	exports.editStateType('Delivery Completed!'),
	(req) => {
		setupAndSendDeliveryCompleteNotification(req.orderDelivery);
	},
];

exports.pickupDelivery = [
	exports.checkCanceled,
	(req, res, next) => {
		req.body.state_type = orderDeliveryConstants.STATE_TYPE_PICKED_UP;
		req.body.pickup_time = sequelize.literal('CURRENT_TIMESTAMP');
		next();
	},
	exports.editStateType('Great! The costumer is waiting for you!'),
];

exports.reject = [
	exports.checkCanceled,
	(req, res, next) => {
		req.body.state_type = orderDeliveryConstants.STATE_TYPE_REJECTED;
		next();
	},
	exports.editStateType('Order Delivery Rejected!'),
];

exports.accept = [
	exports.checkCanceled,
	(req, res, next) => {
		req.body.state_type = orderDeliveryConstants.STATE_TYPE_APPROVED;
		next();
	},
	exports.editStateType('Order Delivery Approved!'),
];

exports.getById = asyncHandler(async (req, res, next) => {
	const orderDelivery = req.orderDelivery;
	res.status(HttpStatus.OK).send(orderDelivery.get({ plain: true }));
});

/**
 * Method: GET
 * Default Price calculation in miles
 */
exports.getDeliveryPrice = asyncHandler(async (req, res, next) => {
	//distance is required
	if (!req.query.distance) {
		return res.status(HttpStatus.BAD_REQUEST).send({
			message: 'Distance is required. Required query param: distance',
		});
	}

	// check if distanceUnit is valid
	if (req.query.distanceUnit) {
		if (
			[
				shippingAddressConstants.DISTANCE_KM,
				shippingAddressConstants.DISTANCE_MILES,
			].indexOf(req.query.distanceUnit) === -1
		) {
			return res.status(HttpStatus.BAD_REQUEST).send({
				message: `Distance Unit should be one of:  ${shippingAddressConstants.DISTANCE_KM},
        ${shippingAddressConstants.DISTANCE_MILES}`,
			});
		}
	}

	let distance = req.query.distance;
	let distanceUnit =
		req.query.distanceUnit || shippingAddressConstants.DISTANCE_MILES;
	// default price calculation in miles
	let price = Number(distance) * appConfig.delivery.unitPrice;

	if (distanceUnit === shippingAddressConstants.DISTANCE_KM) {
		price =
			Number(distance) *
			shippingAddressConstants.MILES_KM_RATIO *
			appConfig.delivery.unitPrice;
	}

	price = utils.round2DecimalPlaces(price);

	return res.status(HttpStatus.OK).send({
		message: `Delivery Price Calculation based on ${distance} ${distanceUnit}`,
		info: 'The delivery price is based on route distance',
		availableDistanceUnits: `${shippingAddressConstants.DISTANCE_MILES}, ${shippingAddressConstants.DISTANCE_KM}`,
		price: price,
	});
});

/**
 * Method: GET
 * Approved deliveries for driver
 */
exports.listApprovedDeliveriesByDriver = asyncHandler(
	async (req, res, next) => {
		try {
			const deliveries = await deliveryRepository.getApprovedDeliveriesByDriver(
				req.userId
			);
			res.status(HttpStatus.OK).send({
				message: 'Here are your orders!',
				data: deliveries,
			});
			return 0;
		} catch (e) {
			console.log(e);
			res.status(HttpStatus.CONFLICT).send({
				message: 'Fail to get your orders!',
				error: true,
			});
			return 0;
		}
	}
);

/**
 * Method: GET
 * Complete deliveries for driver
 */
exports.listCompleteDeliveriesByDriver = asyncHandler(
	async (req, res, next) => {
		try {
			const deliveries = await deliveryRepository.getCompleteDeliveriesByDriver(
				req.userId
			);
			res.status(HttpStatus.OK).send({
				message: 'Here are your orders!',
				data: deliveries,
			});
			return 0;
		} catch (e) {
			console.log(e);
			res.status(HttpStatus.CONFLICT).send({
				message: 'Fail to get your orders!',
				error: true,
			});
			return 0;
		}
	}
);

/**
 * Method: GET
 * Get Delivery Details
 */
exports.getDeliveryDetails = asyncHandler(async (req, res, next) => {
	try {
		const orderDelivery = await orderDeliveryRepository.getDeliveryDetails(
			req.params.orderDeliveryId
		);
		res.status(HttpStatus.OK).send({
			message: 'Here are your orders!',
			data: orderDelivery,
		});
		return 0;
	} catch (e) {
		console.log(e);
		res.status(HttpStatus.CONFLICT).send({
			message: 'Fail to get your orders!',
			error: true,
		});
		return 0;
	}
});

/**
 * Method: GET
 * GET tracking details for a given OrderItemId
 * The response should contain pickup address, drop address, pick up latitude/longitude, drop latitue and longitude */
exports.getOrderItemTrackingData = asyncHandler(async (req, res, next) => {
	let orderItemid = req.params.orderItemId;
	const orderItemDetails = await orderRepository.getOrderItemWithPickupAndDropAddress(
		orderItemid
	);

	return res.status(HttpStatus.OK).send({
		message: 'Success!',
		data: orderItemDetails,
	});
});

async function sendNotification(data, user_id) {
	try {
		//Get user data
		let userData = await repositoryUser.getUserById(user_id);
		if (userData) {
			let device_ids = [];
			let device_registration_tokens = [];

			device_ids.push(userData.device_id);
			device_registration_tokens.push(userData.device_registration_token);

			let notificationData = {
				title: data.title,
				brief: data.brief,
				activity: data.activity,
				device_ids: device_ids.join(),
				device_registration_tokens: device_registration_tokens,
				userId: data.userId,
				order_id: data.orderId,
			};
			await notificationService.sendPushNotification(notificationData);
		} else {
			console.log('Unable to find user data');
		}
	} catch (e) {
		console.log('Error sending notification', e);
	}
}
async function setupAndSendDeliveryCompleteNotification(orderDelivery) {
	try {
		let order_item = await orderRepository.getFirstOrderItemByOrderId(
			orderDelivery.orderId
		);

		let chef_id = order_item.chef.id;
		let user_id = order_item.user_id;
		let notificationData = {
			title:
				notificationConstant.ORDER_DELIVERY_COMPLETED_TITLE +
				order_item.name,
			brief:
				notificationConstant.ORDER_DELIVERY_COMPLETED_BRIEF +
				order_item.name,
			activity: notificationConstant.ACTIVITY_ORDER_DELIVERY_COMPLETED,
			userId: user_id,
			orderId: order_item.orderId,
		};
		await sendNotification(notificationData, chef_id);
	} catch (e) {
		console.log('Error fetching data for notification', e);
	}
}

exports.createChefOrderDelivery = asyncHandler(async (req, res, next) => {
	let contract = new ValidationContract();
	contract.isRequired(
		req.params.orderItemId,
		'The order item ID is required!'
	);

	if (!contract.isValid()) {
		return res.status(HttpStatus.CONFLICT).send(contract.errors()).end();
	}
	let createdOrderDelivery;
	createdOrderDelivery = await OrderDelivery.findOne({
		where: { orderItemID: req.params.orderItemId },
	});

	if (!createdOrderDelivery) {
		const existUser = req.user;
		const user_order_item = await OrderItem.findOne({
			where: { id: req.params.orderItemId },
		});
		const payload = {
			orderId: user_order_item.orderId,
			orderItemID: user_order_item.id,
			order_delivery_type:
				orderDeliveryConstants.DELIVERY_TYPE_ORDER_ITEM,
			userId: user_order_item.user_id,
			driverId: req.userId,
			state_type: orderDeliveryConstants.STATE_TYPE_PICKED_UP,
			delivery_type: orderDeliveryConstants.DELIVERY_TYPE_CHEF,
		};

		if (req.body.pickup_time) {
			payload.pickup_time = req.body.pickup_time;
		}

		if (req.body.dropoff_time) {
			payload.dropoff_time = req.body.dropoff_time;
		}

		createdOrderDelivery = await deliveryRepository.createOrderDelivery(
			payload
		);
	}

	//demandService.sendToDelivery(orderId,loc,shipping)

	let response = {};
	response.status = HttpStatus.CREATED;
	response.orderDelivery = createdOrderDelivery;
	res.status(response.status).send(response);
});

exports.deliveryTimeByItemId = async (req, res) => {
	const { orderItemId, mode } = req.params;
	const orderItemDetails = await orderRepository.getOrderItemByIdDetails(
		orderItemId
	);
	const { user, chef } = orderItemDetails;
	let origins = [`${user.location_lat},${user.location_lon}`];
	let destinations = [`${chef.location_lat},${chef.location_lon}`];
	/*origins = ['40.7421,-73.9914'];
	destinations = ['41.8337329,-87.7321554'];*/
	distance_mat.mode(mode);
	distance_mat.matrix(origins, destinations, (err, distances) => {
		const data = {};
		if (distances.status == 'OK') {
			for (let i = 0; i < origins.length; i++) {
				for (let j = 0; j < destinations.length; j++) {
					let origin = distances.origin_addresses[i];
					let destination = distances.destination_addresses[j];
					if (distances.rows[0].elements[j].status == 'OK') {
						let distance =
							distances.rows[i].elements[j].distance.text;
						let time = distances.rows[i].elements[j].duration.text;
						data.distance = distance;
						data.time = time;
						data.Pickup_address = origin;
						data.Delivery_address = destination;
					}
				}
			}
		}
		if (!_.isEmpty(data)) {
			return res.status(HttpStatus.OK).send({
				message: 'Success!',
				data,
			});
		} else {
			return res.status(HttpStatus.OK).send({
				message: 'Error!',
				data,
			});
		}
	});
};
