const HttpStatus = require("http-status-codes");
const asyncHandler = require("express-async-handler");
const { ShippingAddress } = require("../../models/index");

/**
 * Set user default shipping address
 */
exports.setDefaultAddress = asyncHandler(async (req, res, next) => {
  try {
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

    await require("./_updateUserLocation")._updateUserLocation(
      req,
      existAddress.lat,
      existAddress.lon
    );

    return res
      .status(HttpStatus.OK)
      .send({ message: "User default address successfully set!" });
  } catch (error) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      messege: "Something went wrong, we will get back to you shortly",
      file: "/shippingController/setDefaultAddress",
      error,
    });
  }
});
