"use strict";
const path = require("path");
const HttpStatus = require("http-status-codes");
const ValidationContract = require("../services/validator");
const repository = require("../repository/shipping-repository");
const md5 = require("md5");
const authService = require("../services/auth");
const asyncHandler = require("express-async-handler");

const { User, ShippingAddress, Order } = require("../models/index");

const shippingAddressInputFilters = require(path.resolve(
  "app/inputfilters/shipping-address"
));
const events = require(path.resolve("app/services/events"));
const appConstants = require(path.resolve("app/constants/app"));
const paginator = require(path.resolve("app/services/paginator"));

/**
 * Gets one shipping address of a user and attach to req object
 */
exports.getAuthUserShippingAddress = asyncHandler(async (req, res, next) => {
  //check if shipping_id is present in req body or query
  //if present fetch shipping address by that id instead
  //incase there are multiple shipping address of user, they can select one.
  let shippingId = req.body.shipping_id || req.query.shipping_id;

  let shippingAddress = null;
  if (shippingId) {
    shippingAddress = await repository.getUserAddressByShippingId({
      userId: req.userId,
      shippingId: shippingId,
    });
  } else {
    shippingAddress = await repository.getUserDefaultAddress(req.userId, {
      raw: true,
    });
  }

  const countShippingAddress = await repository.userShippingAddressCount(
    req.userId
  );

  if (countShippingAddress === 0) {
    return res.status(HttpStatus.NOT_FOUND).send({
      message: "User shipping address not found",
      status: HttpStatus.NOT_FOUND,
    });
  }

  //if shipping addresss is single and no default shipping address set, get that one shipping address
  if (countShippingAddress === 1 && !shippingAddress) {
    shippingAddress = await repository.getUserAddress(req.userId, {
      raw: true,
    });
  }

  if (
    (!shippingId && !shippingAddress) ||
    (countShippingAddress > 1 && !shippingAddress)
  ) {
    return res.status(HttpStatus.NOT_FOUND).send({
      message: `User default shipping address not set. There are ${countShippingAddress} shipping registered for user`,
      status: HttpStatus.NOT_FOUND,
    });
  }

  if (!shippingAddress) {
    return res.status(HttpStatus.NOT_FOUND).send({
      message: "User shipping address not found",
      status: HttpStatus.NOT_FOUND,
    });
  }

  req.userShippingAddress = shippingAddress;

  next();
});

/**
 * Gets shipping address by shippingAddressId from param
 */
exports.getShippingAddressByIdMiddleware = asyncHandler(
  async (req, res, next, shippingAddressId) => {
    let shippingAddress = await repository.getExistAddress(shippingAddressId);

    if (!shippingAddress) {
      return res.status(HttpStatus.NOT_FOUND).send({
        message: "User shipping address not found",
        status: HttpStatus.NOT_FOUND,
      });
    }

    req.shippingAddress = shippingAddress;

    next();
  }
);

exports._updateUserLocation = require("./shippingController/_updateUserLocation")._updateUserLocation;
exports.create = require("./shippingController/create").create;
/**
 * Set user default shipping address
 */
exports.setDefaultAddress = asyncHandler(async (req, res, next) => {
  let existAddress = req.shippingAddress;

  if (existAddress.isDefaultAddress === true) {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .send({ message: "This address is already a default address" });
  }

  //set all the user shipping address default to false;
  await ShippingAddress.update(
    { isDefaultAddress: false },
    { where: { userId: req.userId } }
  );

  //now set the current address to default address
  await existAddress.update({ isDefaultAddress: true });

  await exports._updateUserLocation(req, existAddress.lat, existAddress.lon);

  res
    .status(HttpStatus.OK)
    .send({ message: "User default address successfully set!" });
});

/**
 * Set user default shipping address
 */
exports.remove = asyncHandler(async (req, res, next) => {
  let existAddress = req.shippingAddress;

  if (existAddress.isDefaultAddress === true) {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .send({ message: "Cannot remove default address" });
  }

  const orderExists = await Order.findOne({
    where: { shippingId: existAddress.id },
  });

  if (orderExists) {
    return res.status(HttpStatus.BAD_REQUEST).send({
      message: "Cannot remove address. Order exists for this address",
    });
  }

  await existAddress.destroy();

  res.status(HttpStatus.OK).send({ message: "User address removed!" });
});
/**
 * Gets one shipping address of a user and attach to req object if available
 */
exports.getAuthUserShippingAddressOptional = asyncHandler(
  async (req, res, next) => {
    //check if shipping_id is present in req body or query
    //if present fetch shipping address by that id instead
    //incase there are multiple shipping address of user, they can select one.
    let shippingId = req.body.shipping_id || req.query.shipping_id;

    let shippingAddress = null;
    if (shippingId) {
      shippingAddress = await repository.getUserAddressByShippingId({
        userId: req.userId,
        shippingId: shippingId,
      });
    } else {
      shippingAddress = await repository.getUserDefaultAddress(req.userId, {
        raw: true,
      });
    }

    const countShippingAddress = await repository.userShippingAddressCount(
      req.userId
    );

    if (countShippingAddress === 0) {
      return next();
    }

    //if shipping addresss is single and no default shipping address set, get that one shipping address
    if (countShippingAddress === 1 && !shippingAddress) {
      shippingAddress = await repository.getUserAddress(req.userId, {
        raw: true,
      });
    }

    if (
      (!shippingId && !shippingAddress) ||
      (countShippingAddress > 1 && !shippingAddress)
    ) {
      return res.status(HttpStatus.NOT_FOUND).send({
        message: `User default shipping address not set. There are ${countShippingAddress} shipping registered for user`,
        status: HttpStatus.NOT_FOUND,
      });
    }

    if (!shippingAddress) {
      return res.status(HttpStatus.NOT_FOUND).send({
        message: "User shipping address not found",
        status: HttpStatus.NOT_FOUND,
      });
    }

    req.userShippingAddress = shippingAddress;

    next();
  }
);

/**
 * Edit user shipping address
 * should be able to set default address
 */
exports.edit = asyncHandler(async (req, res, next) => {
  let existAddress = req.shippingAddress;
  const userId = req.userId;

  let contract = new ValidationContract();
  contract.isRequired(
    req.body.addressLine1,
    "It is mandatory to inform the address!"
  );
  contract.isRequired(req.body.city, "The city field is required!");
  contract.isRequired(req.body.state, "The state field is required!");
  contract.isRequired(req.body.zipCode, "The zipcode field is required!");
  contract.isRequired(req.body.lat, "The lat(latitude) field is required!");
  contract.isRequired(req.body.lon, "The lon(longitude) field is required!");

  if (req.body.isDefaultAddress === true) {
    if (existAddress.isDefaultAddress === true) {
      return res.status(HttpStatus.CONFLICT).send({
        message:
          "Already a default address. Please remove isDefaultAddress from request",
        status: HttpStatus.CONFLICT,
      });
    }

    //set all the user shipping address default to false;
    await ShippingAddress.update(
      { isDefaultAddress: false },
      { where: { userId } }
    );

    //set to user location
    await exports._updateUserLocation(req, req.body.lat, req.body.lon);

    //set current to default
    existAddress.isDefaultAddress = true;
  }

  if (existAddress.lat !== req.body.lat && existAddress.lon !== req.body.lon) {
    //update user location
    await exports._updateUserLocation(req, req.body.lat, req.body.lon);
  }

  if (!contract.isValid()) {
    res.status(HttpStatus.CONFLICT).send(contract.errors());
    return 0;
  }

  existAddress.addressLine1 = req.body.addressLine1;
  existAddress.addressLine2 = req.body.addressLine2;
  existAddress.city = req.body.city;
  existAddress.state = req.body.state;
  existAddress.zipCode = req.body.zipCode;
  existAddress.lat = req.body.lat;
  existAddress.lon = req.body.lon;
  existAddress.deliveryNote = req.body.deliveryNote;

  await existAddress.save();

  const updatedAddress = await repository.getExistAddress(
    req.params.shippingAddressId
  );

  res
    .status(200)
    .send({ message: "Address successfully updated!", data: updatedAddress });
});

/**
 * List user shipping addresses
 */
exports.list = asyncHandler(async (req, res, next) => {
  //TODO improve pagination query.
  //see customPlatesController.listAllCustomPlates
  const query = {
    userId: req.userId,
    pagination: paginator.paginateQuery(req),
  };
  const addresses = await repository.listAddress(query);

  res
    .status(HttpStatus.OK)
    .send({ data: addresses, ...paginator.paginateInfo(query.pagination) });
});
