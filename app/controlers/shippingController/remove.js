const HttpStatus = require("http-status-codes");
const asyncHandler = require("express-async-handler");
const { Order } = require("../../models/index");

/**
 * Set user default shipping address
 */
exports.remove = asyncHandler(async (req, res, next) => {
  try {
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

    return res.status(HttpStatus.OK).send({ message: "User address removed!" });
  } catch (error) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      messege: "Something went wrong, we will get back to you shortly",
      file: "/shippingController/remove",
      error,
    });
  }
});
