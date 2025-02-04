"use strict";
const path = require("path");
const HttpStatus = require("http-status-codes");
/*const ValidationContract = require('../services/validator');*/
const repository = require("../repository/order-repository");
const repositoryOrderDelivery = require("../repository/orderDelivery-repository");
/*const repositoryOrderPayment = require('../repository/orderPayment-repository');*/
const repositoryWallet = require("../repository/wallet-repository");
const plateRepository = require("../repository/orderPayment-repository");
/*const repositoryShip = require('../repository/shipping-repository');
const repositoryCart = require('../repository/basket-repository');
const md5 = require('md5');*/
const authService = require("../services/auth");
/*const paymentService = require('../services/payment');*/
const controlerHelper = require("./controler-helper");
/*const TransactionsService = require('../services/transactions');*/
const asyncHandler = require("express-async-handler");
const customPlateControllers = require(path.resolve(
  "app/controlers/customPlate-controler"
));
const inputFilters = require(path.resolve("app/inputfilters/order"));
const paginator = require(path.resolve("app/services/paginator"));
const orderItemConstants = require(path.resolve("app/constants/order-item"));
const _ = require("underscore");
/*const notificationService = require(path.resolve('app/services/notification'));*/
const notificationConstant = require(path.resolve(
  "app/constants/notification"
));
/*const repositoryUser = require(path.resolve('app/repository/user-repository'));*/
const FCM = require("../services/fcm");
const customPlateRepo = require("../repository/customPlate-repository");

function distance(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var dLat = ((lat2 - lat1) * Math.PI) / 180;
  var dLon = ((lon2 - lon1) * Math.PI) / 180;
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  if (d > 1) return Math.round(d) + "km";
  else if (d <= 1) return Math.round(d * 1000) + "m";
  return d;
}

const change_data = async (id, data) => {
  let base = {
    orderId: id,
    payment_id: data.id,
    amount: data.amount,
    client_secret: data.client_secret,
    customer: data.customer,
    payment_method: data.payment_method,
    status: data.status,
    receipt_url: data.charges.data[0].receipt_url,
    card_brand: data.charges.data[0].payment_method_details.card.brand,
    card_country: data.charges.data[0].payment_method_details.card.country,
    card_exp_month: data.charges.data[0].payment_method_details.card.exp_month,
    card_exp_year: data.charges.data[0].payment_method_details.card.exp_year,
    card_fingerprint:
      data.charges.data[0].payment_method_details.card.fingerprint,
    card_last: data.charges.data[0].payment_method_details.card.last4,
    network_status: data.charges.data[0].outcome.network_status,
    risk_level: data.charges.data[0].outcome.risk_level,
    risk_score: data.charges.data[0].outcome.risk_score,
    seller_message: data.charges.data[0].outcome.seller_message,
    type: data.charges.data[0].outcome.type,
    paid: data.charges.data[0].paid,
  };
  return base;
};

const post_process = async (
  user_data,
  shipping,
  user_basket,
  basket_content,
  confirmation,
  order_id
) => {
  let cart_items = basket_content.BasketItems.map(async (elem) => {
    let loc = await repository.userLocation(elem.plate.userId);
    let wallet = await repositoryWallet.getWallet(elem.plate.userId);
    let element = {
      orderId: order_id,
      walletId: wallet,
      plate_id: elem.plate.id,
      user_id: elem.plate.userId,
      chef_location: `${loc.addressLine1}, ${loc.addressLine2}, ${loc.city}-${loc.state} / ${loc.zipCode}`,
      name: elem.plate.name,
      description: elem.plate.description,
      amount: elem.plate.price,
      quantity: elem.quantity,
    };
    return element;
  });
  let basket_info = {
    id: user_basket.id,
    items: await Promise.all(cart_items),
  };
  await controlerHelper.createOrderItens(basket_info.items);
  let user_info = {
    id: user_data.id,
    name: user_data.name,
    email: user_data.email,
    phone: `${user_data.country_code + user_data.phone_no}`,
    shipping_address: {
      id: shipping.id,
      line1: shipping.addressLine1,
      line2: shipping.addressLine2,
      city: shipping.city,
      state: shipping.state,
      zip_code: shipping.zipCode,
      lat: shipping.lat,
      lon: shipping.lon,
    },
    basket: basket_info,
    payment_confirmation: confirmation,
  };

  return user_info;
};

exports.orderByIdMiddleware = asyncHandler(async (req, res, next, orderId) => {
  const order = repository.getById(orderId);
  if (!order)
    return res.status(HttpStatus.NOT_FOUND).send({
      message: `Order Not Found by orderId ${req.params.orderId}`,
    });
  req.order = order;
  next();
});

/**
 * Get User Order List
 * Looks into orders table
 */
exports.list = async (req, res, next) => {
  const token_return = await authService.decodeToken(
    req.headers["x-access-token"]
  );
  if (!token_return) {
    res.status(HttpStatus.CONFLICT).send({
      message: "You must be logged in to check your orders",
      error: true,
    });
  }
  try {
    const user_orders = await repository.getUserOrders(token_return.id);
    res.status(HttpStatus.OK).send({
      message: "Here are your orders!",
      data: user_orders,
    });
    return 0;
  } catch (e) {
    console.log(e);
    res.status(HttpStatus.CONFLICT).send({
      message: "Fail to get your orders!",
      error: true,
    });
    return 0;
  }
};

/**
 * Get Chef Order List
 * Looks into orderitems table
 * optional query state_stype
 */
exports.chefOrderList = asyncHandler(async (req, res, next) => {
  const userId = req.userId;
  const page = req.query.page || 0;
  const pageSize = req.query.pageSize || 0;
  const pagination = paginator.paginateQuery(req);

  const query = { chef_id: userId, pagination, page, pageSize };
  const state_type = req.query.state_type;

  if (state_type) {
    query.state_type = state_type;
  }

  const item_type = req.query.item_type;

  let orderItems = await repository.getChefOrders(query);

  if (item_type == "plate") {
    orderItems = orderItems.filter((item) => item.item_type == "plate");
  } else if (item_type == "custom_plate") {
    orderItems = orderItems.filter((item) => item.item_type == "custom_plate");
  }

  const message = `Here are your${state_type ? ` ${state_type} ` : " "}orders!`;

  res.status(HttpStatus.OK).send({
    message,
    data: orderItems,
    ...(page && pageSize && { ...paginator.paginateInfo(pagination) }),
  });
});

//deliveries to auth user.
exports.userOrderItemDeliveries = asyncHandler(async (req, res, next) => {
  const userId = req.userId;
  const pagination = paginator.paginateQuery(req);

  const query = { userId, pagination };
  const state_type = req.query.state_type;

  if (state_type) {
    query.state_type = state_type;
  }

  const orderDeliveries = await repositoryOrderDelivery.getOrderDeliveriesByUser(
    query
  );

  const message = `Here are your${
    state_type ? ` ${state_type} ` : " "
    }order deliveries!`;

  res.status(HttpStatus.OK).send({
    message,
    data: orderDeliveries,
    ...paginator.paginateInfo(pagination),
  });
});

//deliveries for chef
exports.chefOrderItemDeliveries = asyncHandler(async (req, res, next) => {
  const driverId = req.userId;
  const pagination = paginator.paginateQuery(req);

  const query = { driverId, pagination };
  const state_type = req.query.state_type;

  if (state_type) {
    query.state_type = state_type;
  }

  const orderDeliveries = await repositoryOrderDelivery.getOrderDeliveriesByDriver(
    query
  );

  const message = `Here are your${
    state_type ? ` ${state_type} ` : " "
    }orders deliveries!`;

  res.status(HttpStatus.OK).send({
    message,
    data: orderDeliveries,
    ...paginator.paginateInfo(pagination),
  });
});

exports.listTrackingUser = async (req, res, next) => {
  const pagination = paginator.paginateQuery(req);
  const page = req.query.page || 0;
  const pageSize = req.query.pageSize || 0;
  const query = { userId: req.userId, pagination, page, pageSize };
  try {
    const user_orders = await repository.listTrackingUser(query);
    return res.status(HttpStatus.OK).send({
      message: "Here are your orders!",
      data: user_orders,
      ...(page && pageSize && { ...paginator.paginateInfo(pagination) }),
    });
  } catch (e) {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      message: "Fail to get your orders!",
      error: true,
      data: e,
    });
    return 0;
  }
};

exports.listTrackingDriver = async (req, res, next) => {
  try {
    const user_orders = await repository.listTrackingDriver(req.userId);
    res.status(HttpStatus.OK).send({
      message: "Here are your orders!",
      data: user_orders,
    });
    return 0;
  } catch (e) {
    console.log(e);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      message: "Fail to get your orders!",
      error: true,
    });
    return 0;
  }
};

exports.getOneOrder = async (req, res, next) => {
  const token_return = await authService.decodeToken(
    req.headers["x-access-token"]
  );
  if (!token_return) {
    res.status(HttpStatus.CONFLICT).send({
      message: "You must be logged in to check your orders",
      error: true,
    });
  }
  try {
    const user_orders = await repository.getUserOrder(
      token_return.id,
      req.params.orderId
    );
    res.status(HttpStatus.OK).send({
      message: "Here are your order!",
      data: user_orders,
    });
    return 0;
  } catch (e) {
    console.log(e);
    res.status(HttpStatus.CONFLICT).send({
      message: "Fail to get your orders!",
      error: true,
    });
    return 0;
  }
};

/**
 * Create order for plates in basket items.
 * This follows the same process as custom plates
 */
exports.create = [customPlateControllers.checkOut];

/**Edit order state*/
exports.editOrderStateType = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const order = req.order;

  const updates = inputFilters.orderUpdate.filter(req.body);

  await req.order.update(updates);

  res.status(HttpStatus.OK).send({ message: "Updated" });
});

exports.createOrderReview = async (req, res, next) => {
  try {
    let order, orderItem, token_return;

    try {
      order = await repository.getById(req.params.orderId);
      orderItem = await repository.getOrderItemById(req.body.orderItemId);

      if (!order) {
        res.status(409).send({ message: "Order not find!" });
        return;
      }

      if (!orderItem) {
        res.status(409).send({ message: "OrderItem not find!" });
        return;
      }

      if (orderItem.orderId !== order.id) {
        res.status(409).send({
          message: "OrderItem does not belongs to this order!",
        });
        return;
      }
    } catch (error) {
      res.status(409).send({ message: "Error retrieving the order" });
      return;
    }

    try {
      token_return = await authService.decodeToken(
        req.headers["x-access-token"]
      );
    } catch (error) {
      res.status(409).send({ message: "Token expired" });
      return;
    }

    let full_data = req.body;
    full_data.userId = token_return.id;
    full_data.orderId = req.params.orderId;
    full_data.review_type = "plate";

    const createdPlateReview = await repository.createOrderReview(full_data);

    if (createdPlateReview) {
      // send notificaton to chef when a user gave feedback
      const users = await customPlateRepo.getDeviceTokens(
        createdPlateReview.chefID
      );
      const deviceTokens = users
        .filter((user) => user.deviceToken)
        .map((user) => user.deviceToken);
      if (deviceTokens.length > 0) {
        const title = notificationConstant.ORDER_ITEM_REVIEW_TITLE;
        const body = notificationConstant.ORDER_ITEM_REVIEW_BODY;
        let pushnotification = {
          orderTitle: title,
          orderBrief: body,
          device_registration_tokens: deviceTokens,
          detail: users,
        };
        FCM(pushnotification);
      }
    }
    res.status(200).send({
      message: "Review created!",
      data: createdPlateReview,
    });
    return;
  } catch (e) {
    console.log(e);
    res.status(500).send({
      message: "Failed to process your request",
    });
  }
};

exports.ordersReadyForDelivery = async (req, res, next) => {
  const token_return = await authService.decodeToken(
    req.headers["x-access-token"]
  );
  if (!token_return) {
    res.status(HttpStatus.CONFLICT).send({
      message: "You must be logged in to check your orders",
      error: true,
    });
  }
  try {
    const orders_ready = await repository.getOrdersReadyDelivery();
    res.status(HttpStatus.OK).send({
      message: "Orders ready for delivery!",
      data: orders_ready,
    });
    return 0;
  } catch (e) {
    console.log(e);
    res.status(HttpStatus.CONFLICT).send({
      message: "Fail to get your orders!",
      error: true,
    });
    return 0;
  }
};

/**
 * Get all orderitems and their respective orderdeliveries if exists
 * Does left outer join of orderitems with orderdeliveries
 */
exports.orderItemsDelivery = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.userId;
    const pagination = paginator.paginateQuery(req);

    const query = { user_id: userId, pagination };
    const state_type = req.query.state_type;

    if (state_type) {
      query.state_type = state_type;
    }

    const result = await repository.getOrderItemsWithRespectiveDelivery(query);

    const message = `Here are your${
      state_type ? ` ${state_type} ` : " "
      }order items with respective delieveries!`;

    return res.status(HttpStatus.OK).send({
      message,
      data: result,
      ...paginator.paginateInfo(pagination),
    });
  } catch (error) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      error,
      message: "Internal Server Error, will get back to you shortly",
    });
  }
});

/**
 * Order Items
 */

exports.orderItemByIdMiddleware = asyncHandler(async (req, res, next, id) => {
  const orderItem = await repository.getOrderItemByIdDetails(id);
  if (!orderItem)
    return res.status(HttpStatus.NOT_FOUND).send({
      message: `OrderItem Not Found by orderItemId ${req.params.orderItemId}`,
    });
  req.orderItem = orderItem;
  next();
});

/**
 * Get Order Item
 */
exports.getOrderItem = asyncHandler(async (req, res, next) => {
  const user = req.user;

  const orderItem = req.orderItem;

  res.status(HttpStatus.OK).send({
    orderItem: orderItem.get({ plain: true }),
  });
});

/**
 * Update Order Item State Type
 */
exports.editOrderItemStateType = asyncHandler(async (req, res, next) => {
  const { state_type } = req.body;
  const updates = { state_type };
  await req.orderItem.update(updates);
  const orderItem = await repository.getOrderItemByIdDetails(
    req.params.orderItemId
  );

  let orderItemText = ` for the order item ${orderItem.name} and the order item id is ${orderItem.id}`;

  const { chef_id, user_id } = orderItem;
  const userId = state_type === "canceled" ? chef_id : user_id;
  const users = await customPlateRepo.getDeviceTokens(userId);
  const deviceTokens = users
    .filter((user) => user.deviceToken)
    .map((user) => user.deviceToken);
  if (deviceTokens.length > 0) {
    let title = null;
    let body = null;
    switch (state_type) {
      case "canceled":
        title = notificationConstant.ORDER_ITEM_IS_CANCELLED_TITLE;
        body =
          notificationConstant.ORDER_ITEM_IS_CANCELLED_BODY + orderItemText;
        break;
      case "rejected":
        title = notificationConstant.ORDER_ITEM_IS_REJECT_TITLE;
        body = notificationConstant.ORDER_ITEM_IS_REJECT_BODY + orderItemText;
        break;
      case "approved":
        title = notificationConstant.ORDER_ITEM_IS_ACCEPT_TITLE;
        body = notificationConstant.ORDER_ITEM_IS_ACCEPT_BODY + orderItemText;
        break;
      case "ready":
        title = notificationConstant.ORDER_ITEM_IS_READY_TITLE;
        body = notificationConstant.ORDER_ITEM_IS_READY_BODY + orderItemText;
        break;
    }
    let pushnotification = {
      orderTitle: title,
      orderBrief: body,
      device_registration_tokens: deviceTokens,
      detail: users,
    };
    FCM(pushnotification);
  }

  res.status(HttpStatus.OK).send({
    message: "Updated",
    orderItem: orderItem.get({ plain: true }),
  });
  next();
});

/**
 * Update Order Item delivery Type. Delivery type can be  chef/user/driver based on the
 * delivery type chosen by the chef or user
 */
exports.editOrderItemDeliveryType = asyncHandler(async (req, res, next) => {
  if (!_.contains(["chef", "user", "driver"], req.body.delivery_type)) {
    return res
      .status(HttpStatus.NOT_FOUND)
      .send({ message: `Invalid delivery type.` });
  }
  const updates = { deliveryType: req.body.delivery_type };
  await req.orderItem.update(updates);

  const orderItem = await repository.getOrderItemByIdDetails(
    req.params.orderItemId
  );

  res.status(HttpStatus.OK).send({
    message: "Delivery type updated",
    orderItem: orderItem.get({ plain: true }),
  });
});

/**
 * Check if order item is already canceled by user
 */
exports.checkOrderItemCanceled = (req, res, next) => {
  if (req.orderItem.state_type === orderItemConstants.STATE_TYPE_CANCELED) {
    return res.status(HttpStatus.BAD_REQUEST).send({
      message: `Order Item Already Canceled by user. orderItemId: ${req.orderItem.id}`,
    });
  }
  next();
};
/**
 * Chef Accept Order Item by user
 */
exports.chefAcceptOrderItem = [
  exports.checkOrderItemCanceled,
  (req, res, next) => {
    if (req.orderItem.state_type === orderItemConstants.STATE_TYPE_APPROVED) {
      return res.status(HttpStatus.BAD_REQUEST).send({
        message: `Order Item Already Accepted/Approved. orderItemId: ${req.orderItem.id}`,
      });
    }
    req.body.state_type = orderItemConstants.STATE_TYPE_APPROVED;
    next();
  },
  exports.editOrderItemStateType,
];

/**
 * Chef Reject Order Item by user
 */
exports.chefRejectOrderItem = [
  exports.checkOrderItemCanceled,
  (req, res, next) => {
    if (req.orderItem.state_type === orderItemConstants.STATE_TYPE_REJECTED) {
      return res.status(HttpStatus.BAD_REQUEST).send({
        message: `Order Item Already Rejected. orderItemId: ${req.orderItem.id}`,
      });
    }
    req.body.state_type = orderItemConstants.STATE_TYPE_REJECTED;
    next();
  },
  exports.editOrderItemStateType,
];

/**
 * This route should be called when chef finishes preparing the order
 */
exports.chefReadyOrderItem = [
  exports.checkOrderItemCanceled,
  (req, res, next) => {
    if (req.orderItem.state_type === orderItemConstants.STATE_TYPE_READY) {
      return res.status(HttpStatus.BAD_REQUEST).send({
        message: `Order Item Already Ready. orderItemId: ${req.orderItem.id}`,
      });
    }
    req.body.state_type = orderItemConstants.STATE_TYPE_READY;
    next();
  },
  exports.editOrderItemStateType,
  async (req) => {
    // send notification to nearBy drivers
    const { location_lat, location_lon } = req.user;
    const drivers = await customPlateRepo.getNearByUser(
      location_lat,
      location_lon,
      20,
      "driver"
    );
    const deviceTokens = drivers
      .filter((driver) => driver.deviceToken)
      .map((driver) => driver.deviceToken);
    if (deviceTokens.length > 0) {
      const title = notificationConstant.DRIVER_ORDER_READY_TITLE;
      const body = notificationConstant.DRIVER_ORDER_READY_BODY;
      let pushnotification = {
        orderTitle: title,
        orderBrief: body,
        device_registration_tokens: deviceTokens,
        detail: drivers,
      };
      FCM(pushnotification);
    }
  },
];

/**
 * This route should be called when user wants to cancel orderitem before chef approves the orderitem
 */
exports.userCancelOrderItem = [
  (req, res, next) => {
    if (req.orderItem.state_type === orderItemConstants.STATE_TYPE_APPROVED) {
      return res.status(HttpStatus.BAD_REQUEST).send({
        message: `Order Item Already Approved by Chef. Cannot cancel order. orderItemId: ${req.orderItem.id}`,
      });
    }

    if (req.orderItem.state_type === orderItemConstants.STATE_TYPE_CANCELED) {
      return res.status(HttpStatus.BAD_REQUEST).send({
        message: `Order Item Already Cancelled. orderItemId: ${req.orderItem.id}`,
      });
    }
    req.body.state_type = orderItemConstants.STATE_TYPE_CANCELED;
    next();
  },
  exports.editOrderItemStateType,
  /*(req) => {
		let chef_id = req.orderItem.chef_id;
		let user_id = req.orderItem.user_id;
		let notificationData = {
			title: notificationConstant.ORDER_ITEM_IS_CANCELLED_TITLE,
			brief:
				req.orderItem.name +
				' ' +
				notificationConstant.ORDER_ITEM_IS_CANCELLED_BRIEF,
			activity: notificationConstant.ACTIVITY_ORDER_ITEM_CANCELLED,
			userId: user_id,
			orderId: req.orderItem.orderId,
		};
		sendNotification(notificationData, chef_id);
	},*/
];

exports.completeChefOrder = async (req, res, next) => {
  try {
    const completed = await repository.completeChefOrder(
      req.params.orderItemId
    );
    res.status(HttpStatus.OK).send({
      message: "Completed Order!",
      data: completed,
    });
    return 0;
  } catch (e) {
    console.log(e);
    res.status(HttpStatus.CONFLICT).send({
      message: "Fail to complete your orders!",
      error: true,
    });
    return 0;
  }
};

exports.promotion = async (req, res) => {
  const { promoCode, amount } = req.body;
  const response = await plateRepository.promotion(promoCode);
  if (response) {
    const discount = (amount * response.discount) / 100;
    const finalAmount = amount - discount;
    res.status(HttpStatus.OK).json({
      message: "Valid PromoCode",
      data: { amount, finalAmount },
    });
  } else {
    res.status(HttpStatus.BAD_REQUEST).json({
      message: "InValid PromoCode",
      data: { amount, finalAmount: amount },
    });
  }
};
