const repository = require("../../repository/shipping-repository");
const HttpStatus = require("http-status-codes");
const asyncHandler = require("express-async-handler");

/**
 * Gets shipping address by shippingAddressId from param
 */
exports.getShippingAddressByIdMiddleware = asyncHandler(
  async (req, res, next, shippingAddressId) => {
    try {
      let shippingAddress = await repository.getExistAddress(shippingAddressId);

      if (!shippingAddress) {
        return res.status(HttpStatus.NOT_FOUND).send({
          message: "User shipping address not found",
          status: HttpStatus.NOT_FOUND,
        });
      }

      req.shippingAddress = shippingAddress;

      next();
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        messege: "Something went wrong, we will get back to you shortly",
        file: "/shippingController/getShippingAddressByIdMiddleware",
        error,
      });
    }
  }
);
