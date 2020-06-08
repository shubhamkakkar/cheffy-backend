const asyncHandler = require("express-async-handler");
const path = require("path");
const HttpStatus = require("http-status-codes");
const ValidationContract = require("../../services/validator");
const repository = require("../../repository/shipping-repository");
const _updateUserLocation = require("./_updateUserLocation")
  ._updateUserLocation;
/**
 * Edit user shipping address
 * should be able to set default address
 */
exports.edit = asyncHandler(async (req, res, next) => {
  try {
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
      await _updateUserLocation(req, req.body.lat, req.body.lon);

      //set current to default
      existAddress.isDefaultAddress = true;
    }

    if (
      existAddress.lat !== req.body.lat &&
      existAddress.lon !== req.body.lon
    ) {
      //update user location
      await _updateUserLocation(req, req.body.lat, req.body.lon);
    }

    if (!contract.isValid()) {
      return res.status(HttpStatus.CONFLICT).send({
        message: contract.errors(),
      });
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

    return res
      .status(200)
      .send({ message: "Address successfully updated!", data: updatedAddress });
  } catch (error) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      message: "Something went wrong, would get back to you soon",
      error,
      file: "/shippingController/edit",
    });
  }
});
