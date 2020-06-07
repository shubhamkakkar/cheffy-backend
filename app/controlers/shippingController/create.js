const asyncHandler = require("express-async-handler");
const path = require("path");
const HttpStatus = require("http-status-codes");
const ValidationContract = require("../../services/validator");
const repository = require("../../repository/shipping-repository");
const shippingAddressInputFilters = require(path.resolve(
  "app/inputfilters/shipping-address"
));
const appConstants = require(path.resolve("app/constants/app"));
const events = require(path.resolve("app/services/events"));

exports.create = asyncHandler(async (req, res, next) => {
  try {
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
    //req.body.isDefaultAddress boolean field in optional
    //contract.isRequired(req.body.zipCode, "The zipcode field is required!");
    if (!contract.isValid()) {
      return res.status(HttpStatus.CONFLICT).send({
        message: contract.errors(),
      });
    }

    const userId = req.userId;

    const existsAddressQuery = {
      userId,
      lat: req.body.lat,
      lon: req.body.lon,
    };

    const existAddress = await repository.checkExistAddress(existsAddressQuery);
    if (existAddress) {
      return res
        .status(HttpStatus.CONFLICT)
        .send({ message: "You already have this address registered" });
    }

    let full_data = shippingAddressInputFilters.filter(req.body);
    full_data.userId = req.userId;

    //if isDefaultAddress is sent from request, check if default shipping address exists.
    //if not continue. if yes then throw bad response
    // if(req.body.isDefaultAddress === true) {
    //   const existAddress = await repository.getUserDefaultAddress(userId);
    //   if(existAddress) {
    //     return res.status(HttpStatus.OK);
    //   }
    //   //if no default shippingAddress exists, set the location field of user
    //   //shipping address with isDefaultAddress will be created
    // } else {
    //if no isDefaultAddress sent in body check for shipping Addres count.
    //if this is the first shipping address, set it as default and update user location fields

    const shippingAddressCount = await repository.userShippingAddressCount(
      req.userId
    );
    if (shippingAddressCount === 0) {
      full_data.isDefaultAddress = true;
      await require("./_updateUserLocation")._updateUserLocation(
        req,
        req.body.lat,
        req.body.lon
      );
    }
    //}
    const address = await repository.createAddress(full_data);

    //publish create action
    events.publish(
      {
        action: appConstants.ACTION_TYPE_CREATED,
        user: req.user,
        shippingAddress: address,
        body: req.body,
        scope: appConstants.SCOPE_ALL,
        type: "shippingAddress",
      },
      req
    );
    return res.status(HttpStatus.OK).send({
      message: "Successfully created shipping address!",
      data: address,
    });
  } catch (error) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      message: "Something went wrong, would get back to you soon",
      error,
    });
  }
});
