const HttpStatus = require("http-status-codes");
const asyncHandler = require("express-async-handler");
const repository = require("../../repository/shipping-repository");

/**
 * Gets one shipping address of a user and attach to req object
 */
exports.getAuthUserShippingAddress = asyncHandler(async (req, res, next) => {
  //check if shipping_id is present in req body or query
  //if present fetch shipping address by that id instead
  //incase there are multiple shipping address of user, they can select one.
  try {
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
  } catch (error) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      message: "Something went wrong, would get back to you soon",
      error,
      file: "/shippingController/create",
    });
  }
});
