"use strict";
const path = require("path");
const HttpStatus = require("http-status-codes");
const ValidationContract = require("../services/validator");
const repository = require("../repository/customPlate-repository");
const repositoryOrderPayment = require("../repository/orderPayment-repository");
const repositoryWallet = require("../repository/wallet-repository");
/*const repositoryShip = require('../repository/shipping-repository');*/
const basketRepository = require("../repository/basket-repository");
const repositoryOrder = require("../repository/order-repository");
const repositoryOrderDelivery = require("../repository/orderDelivery-repository");
/*const authService = require('../services/auth');*/
const paymentService = require("../services/payment");
const helpers = require("./controler-helper");
const {
  User,
  CustomPlate,
  CustomPlateOrder,
  OrderFrequency,
} = require("../models/index");
const TransactionsService = require("../services/transactions");
const asyncHandler = require("express-async-handler");
const customPlateInputFilter = require(path.resolve(
  "app/inputfilters/custom-plate"
));
const userConstants = require(path.resolve("app/constants/users"));
const paginator = require(path.resolve("app/services/paginator"));
const basketConstants = require(path.resolve("app/constants/baskets"));
const customPlateConstants = require(path.resolve(
  "app/constants/custom-plates"
));
const debug = require("debug")("custom-plate");

const events = require(path.resolve("app/services/events"));
const appConstants = require(path.resolve("app/constants/app"));

const orderPaymentConstants = require(path.resolve(
  "app/constants/order-payment"
));
const orderConstants = require(path.resolve("app/constants/order"));
const orderDeliveryConstants = require(path.resolve(
  "app/constants/order-delivery"
));
const orderItemConstants = require(path.resolve("app/constants/order-item"));
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const notificationConstant = require(path.resolve(
  "app/constants/notification"
));
const FCM = require("../services/fcm");
const { PAYMENT_TYPE_COD } = require("../constants/order-item");

/**
 * Helper method
 * add one day for closing date of the custom plate auction.
 */

exports.customPlateByIdMiddleware = asyncHandler(
  async (req, res, next, customPlateId) => {
    const customPlate = await repository.getCustomPlate(customPlateId);
    if (!customPlate)
      return res.status(HttpStatus.NOT_FOUND).send({
        message: `Custom Plate Not Found by id ${customPlateId}`,
      });
    req.customPlate = customPlate;
    next();
  }
);

exports.customPlateImageByIdMiddleware = asyncHandler(
  async (req, res, next, customPlateImageId) => {
    const customPlateImage = await repository.getCustomPlateImage(
      customPlateImageId
    );
    if (!customPlateImage)
      return res.status(HttpStatus.NOT_FOUND).send({
        message: `Custom Plate Image Not Found by id ${customPlateImageId}`,
      });
    req.customPlateImage = customPlateImage;
    next();
  }
);

exports.addCustomPlate = require("./customPlateController/addCustomPlate").addCustomPlate;
/**
 * Edit Custom Plate
 * Don't allow to edit if auction is closed
 */
exports.editCustomPlate = [
  asyncHandler(async (req, res, next) => {
    const customPlateAuction = await repository.getCustomPlateAuctionByCustomPlate(
      req.customPlate.id
    );

    if (!customPlateAuction) {
      return res.status(HttpStatus.BAD_REQUEST).send({
        message: "The auction for this is already removed! Contact Support",
      });
    }

    if (
      customPlateAuction.state_type === customPlateConstants.STATE_TYPE_CLOSED
    ) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .send({ message: "The auction is already closed." });
    }
    next();
  }),
  asyncHandler(async (req, res, next) => {
    debug("req.body", req.body);
    let contract = new ValidationContract();

    if (!contract.isValid()) {
      res.status(HttpStatus.CONFLICT).send(contract.errors()).end();
      return 0;
    }

    const user = req.user;

    if (user.user_type !== userConstants.USER_TYPE_USER) {
      return res.status(HttpStatus.BAD_REQUEST).send({
        message: `Only 'user' role can create custom plate.`,
        status: HttpStatus.BAD_REQUEST,
      });
    }

    let data_received = customPlateInputFilter.filter(req.body, "form-data");
    let images, images_create;

    if (data_received.images) {
      images = data_received.images;
      delete data_received.images;
    }

    //const customPlate = await repository.create(data_received);
    const customPlate = await req.customPlate.update(data_received);

    if (req.files && req.files["custom_plate_image"]) {
      //images = req.files['profile_photo'][0].key;
      images = req.files["custom_plate_image"];
    }

    if (images) {
      let images_data = [];
      images.forEach((elem) => {
        elem.customPlateId = customPlate.id;
        elem.name = customPlate.name;
        elem.url = elem.url;
        images_data.push(elem);
      });

      images_create = await repository.createPlateImage(images_data);
    }

    //create auction for the plate
    const auction = await repository.getCustomPlateAuctionByCustomPlate(
      customPlate.id
    );

    const payload = {};
    payload.status = HttpStatus.CREATED;
    //should we name the property plate or custom plate
    payload.customPlate = customPlate;
    payload.auction = auction;
    payload.images = images_create;
    debug("res payload", payload);
    res.status(HttpStatus.CREATED).send({
      message: "The custom plate was successfully updated!",
      data: payload,
    });

    //publish edit action
    events.publish(
      {
        action: appConstants.ACTION_TYPE_UPDATED,
        user: req.user,
        cutomPlate: customPlate,
        payload: payload,
        scope: appConstants.SCOPE_USER,
        type: "customPlate",
      },
      req
    );
  }),
];

exports.addImages = asyncHandler(async (req, res, next) => {
  const customPlate = req.customPlate;
  let images = null;
  if (req.files && req.files["custom_plate_image"]) {
    images = req.files["custom_plate_image"];
  }

  if (!images)
    return res
      .status(HttpStatus.BAD_REQUEST)
      .send({ message: "No images sent for upload" });

  let images_data = [];
  images.forEach((elem) => {
    elem.customPlateId = customPlate.id;
    elem.name = customPlate.name;
    elem.url = elem.url;
    images_data.push(elem);
  });

  const createdImages = await repository.createPlateImage(images_data);

  res.status(HttpStatus.OK).send({
    message: "Custom Plate images uploaded successfully.",
    images: createdImages,
  });

  events.publish(
    {
      action: appConstants.ACTION_TYPE_IMAGE_ADDED,
      user: req.user,
      cutomPlate: customPlate,
      payload: images_data,
      scope: appConstants.SCOPE_USER,
      type: "customPlate",
    },
    req
  );
});

exports.deleteImage = asyncHandler(async (req, res, next) => {
  const customPlateImage = req.customPlateImage;

  await customPlateImage.destroy();

  res.status(HttpStatus.OK).send({
    message: `Custom Plate Image by Id : ${customPlateImage.id} removed`,
  });

  events.publish(
    {
      action: appConstants.ACTION_TYPE_IMAGE_DELETED,
      user: req.user,
      cutomPlate: req.customPlate,
      payload: customPlateImage,
      scope: appConstants.SCOPE_USER,
      type: "customPlate",
    },
    req
  );
});

/**
 * Method: POST
 * Place custom bid by chef user for a custom plate
 */
exports.bidCustomPlate = asyncHandler(async (req, res, next) => {
  const authUser = req.user;
  /*debug('req body', req.body);*/
  if (authUser.user_type !== userConstants.USER_TYPE_CHEF) {
    return res.status(HttpStatus.CONFLICT).send({
      message: `Only 'chef' user can place a bid for a custom plate.`,
      error: true,
    });
  }

  if (!req.body.auction) {
    return res.status(HttpStatus.CONFLICT).send({
      message: "You need to send auction(customPlateId)",
      status: HttpStatus.CONFLICT,
    });
  }

  if (!req.body.price) {
    return res.status(HttpStatus.CONFLICT).send({
      message: "You need to give a price!",
      status: HttpStatus.CONFLICT,
    });
  }

  if (!req.body.preparation_time) {
    return res.status(HttpStatus.CONFLICT).send({
      message: "You need to estimate a preparation time!",
      status: HttpStatus.CONFLICT,
    });
  }

  if (!req.body.chefDeliveryAvailable) {
    return res.status(HttpStatus.CONFLICT).send({
      message: "You need to state whether you deliver or not!",
      status: HttpStatus.CONFLICT,
    });
  }

  if (req.body.chefDeliveryAvailable && !req.body.delivery_time) {
    return res.status(HttpStatus.CONFLICT).send({
      message: "You need to state whether delivery time in minutes!",
      status: HttpStatus.CONFLICT,
    });
  }

  let context = {
    CustomPlateAuctionID: req.body.auction,
    chefID: authUser.id,
    price: req.body.price,
    preparation_time: req.body.preparation_time,
    chefDeliveryAvailable: req.body.chefDeliveryAvailable,
    delivery_time: req.body.delivery_time,
  };

  //check if auction is closed;
  const auction = await repository.getCustomPlateAuction(req.body.auction);

  if (!auction) {
    return res
      .status(HttpStatus.NOT_FOUND)
      .send({ message: "Auction Not Found" });
  }

  //check auction closing date
  //TODO use moment library
  const customPlate = await repository.getCustomPlate(auction.customPlateId);
  if (new Date() >= customPlate.close_date) {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .send({ message: "Auction Date Expired" });
  }

  if (auction.state_type === customPlateConstants.STATE_TYPE_CLOSED) {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .send({ message: "Auction Already Closed" });
  }

  const data = await repository.bidCustomPlate(context);
  /*debug('bid data', data);*/
  res.status(HttpStatus.CREATED).send({
    message: "Your bid was registered!",
    data: data,
  });

  events.publish(
    {
      action: appConstants.ACTION_TYPE_CREATED,
      user: req.user,
      customPlate: customPlate,
      customPlateAuctionBid: data,
      payload: data,
      scope: appConstants.SCOPE_CHEF,
      type: "customPlateAuctionBid",
    },
    req
  );

  // send notification to user when any chef placed a bid
  const users = repository.getDeviceTokens(auction.userId);
  const deviceTokens = users
    .filter((user) => user.deviceToken)
    .map((user) => user.deviceToken);
  if (deviceTokens.length > 0) {
    const title = notificationConstant.CUSTOMPLATE_BID_TITLE;
    const body = notificationConstant.CUSTOMPLATE_BID_BODY;
    let pushnotification = {
      orderTitle: title,
      orderBrief: body,
      device_registration_tokens: deviceTokens,
      detail: users,
    };
    FCM(pushnotification);
  }
});

/**
 * Method: POST
 * Reject a custom plate auction by chef user
 */
exports.rejectCustomPlateAuction = asyncHandler(async (req, res, next) => {
  const authUser = req.user;

  if (authUser.user_type !== userConstants.USER_TYPE_CHEF) {
    return res.status(HttpStatus.CONFLICT).send({
      message: `Only 'chef' user can reject an auction of custom plate.`,
      error: true,
    });
  }

  if (!req.body.auction) {
    return res.status(HttpStatus.CONFLICT).send({
      message: "You need to send auction(customPlateId)",
      status: HttpStatus.CONFLICT,
    });
  }

  let context = {
    CustomPlateAuctionID: req.body.auction,
    chefID: authUser.id,
    reject_reason: req.body.reject_reason,
  };

  //check if auction is closed;
  const auction = await repository.getCustomPlateAuction(req.body.auction);

  if (!auction) {
    return res
      .status(HttpStatus.NOT_FOUND)
      .send({ message: "Auction Not Found" });
  }
  //check auction closing date
  const customPlate = await repository.getCustomPlate(auction.customPlateId);
  if (new Date() >= customPlate.close_date) {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .send({ message: "Auction Date Expired" });
  }

  if (auction.state_type === customPlateConstants.STATE_TYPE_CLOSED) {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .send({ message: "Auction Already Closed" });
  }

  let chef_rejection_status = await repository.hasChefRejectedAuction(
    req.body.auction,
    authUser.id
  );
  if (chef_rejection_status) {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .send({ message: "Chef has already rejected this auction" });
  }

  let bid_status = await repository.hasChefBiddedAuction(
    req.body.auction,
    authUser.id
  );
  if (bid_status) {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .send({ message: "Already bidded auction cannot be rejected" });
  }

  const data = await repository.rejectAuctionOfACustomPlate(context);
  res.status(HttpStatus.CREATED).send({
    message: "Chef has successfully rejected the custom plate auction",
    data: data,
  });
});

/**
 * Method: POST
 * Customer rejects a custom plate auction bid placed by chef
 */
exports.rejectCustomPlateAuctionBid = asyncHandler(async (req, res, next) => {
  const authUser = req.user;

  const bidId = req.params.bidId;
  if (authUser.user_type !== userConstants.USER_TYPE_USER) {
    return res.status(HttpStatus.CONFLICT).send({
      message: `Only 'user' can reject a bid for a custom plate.`,
      error: true,
    });
  }
  //check if auction is closed;
  const bid_details = await repository.getCustomPlateBid(bidId);

  if (bid_details.userId !== authUser.id) {
    return res.status(HttpStatus.CONFLICT).send({
      message: "Only custom plate owner can reject a bid for that plate",
      status: HttpStatus.CONFLICT,
    });
  }

  let context = {
    CustomPlateAuctionBidId: bidId,
    userId: authUser.id,
    reject_reason: req.body.reject_reason,
  };

  if (!bid_details) {
    return res.status(HttpStatus.NOT_FOUND).send({ message: "Bid not Found" });
  }
  //Check if this bid is already paid by customer
  if (bid_details.winner) {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .send({ message: "Accepted bid cannot be rejected" });
  }

  const data = await repository.rejectAuctionBidOfACustomPlate(context);
  res.status(HttpStatus.CREATED).send({
    message: "Customer has successfully rejected the custom plate auction bid",
    data: data,
  });

  // send notification chef when user reject's chefs bid
  const users = repository.getDeviceTokens(bid_details.chefID);
  const deviceTokens = users
    .filter((user) => user.deviceToken)
    .map((user) => user.deviceToken);
  if (deviceTokens.length > 0) {
    const title = notificationConstant.CUSTOMPLATE_REJECT_TITLE;
    const body = notificationConstant.CUSTOMPLATE_REJECT_BODY;
    let pushnotification = {
      orderTitle: title,
      orderBrief: body,
      device_registration_tokens: deviceTokens,
      detail: users,
    };
    FCM(pushnotification);
  }
});

/**
 * Method: POST
 * User accept auction bid for a chef
 * CustomPlateOrder is created when user accepts auction bid
 */
exports.acceptCustomPlateBid = asyncHandler(async (req, res, next) => {
  //get bid document by id
  let customPlateAuctionBid = await repository.getCustomPlateBid(
    req.params.auctionBidId
  );

  if (!customPlateAuctionBid) {
    return res.status(HttpStatus.NOT_FOUND).send({ message: "Bid Not Found" });
  }

  let customPlateAuction = await repository.getCustomPlateAuction(
    customPlateAuctionBid.auctionId
  );

  if (
    customPlateAuction.state_type === customPlateConstants.STATE_TYPE_CLOSED
  ) {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .send({ message: "Auction Already Closed" });
  }

  //check date
  if (new Date() >= customPlateAuctionBid.custom_plate.close_date) {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .send({ message: "Auction Date Expired" });
  }

  const customPlateOrderPayload = {
    ...customPlateAuctionBid,
    customPlateId: customPlateAuctionBid.custom_plate.id,
    chefID: customPlateAuctionBid.chefID,
    chefDeliveryAvailable: customPlateAuctionBid.chefDeliveryAvailable,
    userId: req.userId,
  };

  let custom_order = await repository.createCustomOrder(
    customPlateOrderPayload
  );

  let basket = await basketRepository.getOrCreateUserBasket(req.userId);

  let body = {
    quantity: customPlateAuctionBid.quantity,
    basket_type: basketConstants.BASKET_TYPE_CUSTOM_PLATE,
    basketId: basket[0].id,
    customPlateId: custom_order.id,
  };

  debug("user basket", basket);
  basket = basket[0].get({ plain: true });
  // basket = JSON.stringify(basket);
  // basket = JSON.parse(basket);
  // basket = basket[0];
  await basketRepository.createBasketItem(body);

  debug("user basket", basket);
  debug("custom order", custom_order);

  res.status(HttpStatus.CREATED).send({
    message: "Bid accepted, let's checkout now!",
    plate_data: custom_order,
    basket: basket,
  });

  //close the auction and set winner
  await customPlateAuction.update({
    state_type: customPlateConstants.STATE_TYPE_CLOSED,
    winner: customPlateAuctionBid.userId,
  });

  await repository.updateCustomPlateBidById({
    id: customPlateAuctionBid.id,
    data: { winner: true },
  });

  events.publish(
    {
      action: appConstants.ACTION_TYPE_ACCEPTED,
      user: req.user,
      payload: {
        customPlate: customPlateAuctionBid.custom_plate,
        customOrder: custom_order,
      },
      customPlateAuctionBid: customPlateAuctionBid,
      scope: appConstants.SCOPE_USER,
      type: "customPlateAuctionBid",
    },
    req
  );

  // send notification chef when user accepts's chefs bid
  const users = repository.getDeviceTokens(customPlateAuctionBid.chefID);
  const deviceTokens = users
    .filter((user) => user.deviceToken)
    .map((user) => user.deviceToken);
  if (deviceTokens.length > 0) {
    const title = notificationConstant.CUSTOMPLATE_ACCEPT_TITLE;
    const body = notificationConstant.CUSTOMPLATE_ACCEPT_BODY;
    let pushnotification = {
      orderTitle: title,
      orderBrief: body,
      device_registration_tokens: deviceTokens,
      detail: users,
    };
    FCM(pushnotification);
  }
});

exports.checkOut = require("./customPlateController/checkout").checkOut;

/**
 * Method: GET
 * Get custom plate orders of a user.
 */
exports.listUserCustomOrders = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const query = { where: { userId }, ...paginator.paginateQuery(req) };
  const customPlateOrders = await CustomPlateOrder.findAll(query);
  res.status(HttpStatus.OK).send({
    message: "Your custom order's",
    ...paginator.paginateInfo(query),
    data: customPlateOrders,
  });

  events.publish(
    {
      action: appConstants.ACTION_TYPE_LISTED,
      user: req.user,
      payload: customPlateOrders,
      scope: appConstants.SCOPE_ALL,
      type: "customPlateOrder",
    },
    req
  );
});

/**
 * Method: GET
 * Get custom plates of a user.
 * don't check for user roles as well. just show empty plates for driver, chef user type
 * All user can see each other custom plates
 */
exports.listUserCustomPlates = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const query = { where: { userId }, ...paginator.paginateQuery(req) };
  const customPlates = await CustomPlate.findAll(query);
  res.status(HttpStatus.OK).send({
    message: `Custom Plates of: ${req.paramUser.name}`,
    ...paginator.paginateInfo(query),
    data: customPlates,
  });

  events.publish(
    {
      action: appConstants.ACTION_TYPE_LISTED,
      user: req.user,
      params: req.params,
      payload: customPlates,
      scope: appConstants.SCOPE_ALL,
      type: "customPlate",
    },
    req
  );
});
/**
 * Method: GET
 * Get custom plates of auth user.
 */
exports.listMyCustomPlates = asyncHandler(async (req, res, next) => {
  const userId = req.userId;
  const query = { userId, pagination: paginator.paginateQuery(req) };

  //const customPlates = await CustomPlate.findAll(query);
  const myCustomPlates = await repository.myCustomPlates(query);
  res.status(HttpStatus.OK).send({
    message: "Your Custom Plates",
    ...paginator.paginateInfo(query),
    data: myCustomPlates,
  });

  events.publish(
    {
      action: appConstants.ACTION_TYPE_LISTED,
      user: req.user,
      payload: myCustomPlates,
      scope: appConstants.SCOPE_USER,
      type: "customPlate",
    },
    req
  );
});

/**
 * Method: GET
 * Get custom plates of all users.
 */
exports.listAllCustomPlates = asyncHandler(async (req, res, next) => {
  const query = { ...paginator.paginateQuery(req) };
  const customPlates = await CustomPlate.findAll(query);

  res.status(HttpStatus.OK).send({
    message: "All custom plates from users.",
    ...paginator.paginateInfo(query),
    data: customPlates,
  });

  events.publish(
    {
      action: appConstants.ACTION_TYPE_LISTED,
      user: req.user,
      payload: customPlates,
      scope: appConstants.SCOPE_USER,
      type: "customPlate",
    },
    req
  );
});

/**
 * Custom Plates search/filter for Chef
 * Get custom plates with all infos like auctions
 * Filter by params
 */
exports.chefSearchCustomPlates = asyncHandler(async (req, res, next) => {
  const options = {
    req,
    query: req.query,
    pagination: paginator.paginateQuery(req),
  };

  const result = await repository.chefGetPlates(options);

  res.status(HttpStatus.OK).send({
    data: result,
    ...paginator.paginateInfo(options.pagination),
  });

  events.publish(
    {
      action: appConstants.ACTION_TYPE_LISTED,
      user: req.user,
      query: req.query,
      payload: result,
      scope: appConstants.SCOPE_CHEF,
      type: "customPlate",
    },
    req
  );
});

/**
 * Get one custom plate with all infos like auctions
 */
exports.customPlate = asyncHandler(async (req, res, next) => {
  const result = await repository.getPlate(req.params.customPlateId);
  if (!result) {
    return res
      .status(HttpStatus.NOT_FOUND)
      .send({ message: "Custom Plate Not Found" });
  }

  res.status(HttpStatus.OK).send(result);

  events.publish(
    {
      action: appConstants.ACTION_TYPE_VIEWED,
      user: req.user,
      customPlate: result,
      scope: appConstants.SCOPE_ALL,
      type: "customPlate",
    },
    req
  );
});

/**
 * Soft delete a custom plate bid.
 * req.params.bidId : id from CustomPlateAuctionBids
 */
exports.deleteCustomPlateBid = asyncHandler(async (req, res, next) => {
  try {
    let customPlateAuctionBid = await repository.getCustomPlateBid(
      req.params.bidId
    );

    if (!customPlateAuctionBid) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .send({ message: "Bid Not Found" });
    }

    if (customPlateAuctionBid.winner) {
      return res.status(HttpStatus.NOT_FOUND).send({
        message: "Bid accepted by customer cannot be deleted",
      });
    }
    let response = await repository.deleteCustomAuctionBid(req.params.bidId);
    res.status(HttpStatus.OK).send({
      message: "Deleted the custom plate bid!",
      data: response,
    });
  } catch (e) {
    console.log(e);
    return res.status(HttpStatus.CONFLICT).send({
      message: "Failed to delete the custom plate bid",
      data: e,
      error: true,
    });
  }
});
