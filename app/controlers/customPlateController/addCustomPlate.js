const ValidationContract = require("../../services/validator");
const debug = require("debug")("custom-plate");
const asyncHandler = require("express-async-handler");
const HttpStatus = require("http-status-codes");
const path = require("path");
const userConstants = require(path.resolve("app/constants/users"));
const basketRepository = require("../../repository/basket-repository");
const customPlateInputFilter = require(path.resolve(
  "app/inputfilters/custom-plate"
));
const repository = require("../../repository/customPlate-repository");
const events = require(path.resolve("app/services/events"));
const appConstants = require(path.resolve("app/constants/app"));
const notificationConstant = require(path.resolve(
  "app/constants/notification"
));
const FCM = require("../../services/fcm");

/**
 * Method: POST
 * Add Custom plate by 'user' role type
 */

function addDays() {
  var result = new Date();
  result.setDate(result.getDate() + 1);
  return result;
}

exports.addCustomPlate = asyncHandler(async (req, res, next) => {
  try {
    debug("req.body", req.body);
    let contract = new ValidationContract();
    const { chef_location_radius } = req.body;
    contract.hasMinLen(
      req.body.name,
      3,
      "The plate name should have more than 3 caracteres"
    );
    contract.isRequired(req.body.description, "Plate description is required!");
    contract.isRequired(req.body.price_min, "Minimum price is required!");
    contract.isRequired(req.body.price_max, "The maximum price is required!");
    contract.isRequired(
      req.body.quantity,
      "The amount of plates is obligatory!"
    );
    //contract.isRequired(req.body.chef_location_radius, 'The amount of plates is obligatory!');

    if (!contract.isValid()) {
      return res.status(HttpStatus.CONFLICT).send({
        message: contract.errors(),
      });
    }

    const user = req.user;

    if (user.user_type !== userConstants.USER_TYPE_USER) {
      return res.status(HttpStatus.BAD_REQUEST).send({
        message: `Only 'user' role can create custom plate, ${user.name} is ${user.user_type}`,
        status: HttpStatus.BAD_REQUEST,
      });
    }
    let shippingAddress = await basketRepository.getShippingAddressOfUser(
      user.id
    );

    // if (!shippingAddress) {
    //   return res.status(HttpStatus.CONFLICT).send({
    //     message: `Please enter atleast one address for shipping.`,
    //     status: HttpStatus.CONFLICT,
    //   });
    // }

    let data_received = customPlateInputFilter.filter(req.body, "form-data");
    let images, images_create;

    data_received.userId = user.id;
    data_received.close_date = addDays();

    if (data_received.images) {
      images = data_received.images;
      delete data_received.images;
    }

    const customPlate = await repository.create(data_received);

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
    const auction = await repository.createAuction({
      customPlateId: customPlate.id,
      userId: user.id,
    });

    const payload = {};
    payload.status = HttpStatus.CREATED;
    //should we name the property plate or custom plate
    payload.customPlate = customPlate;
    payload.auction = auction;
    payload.images = images_create;
    debug("res payload", payload);

    //publish create action
    events.publish(
      {
        action: appConstants.ACTION_TYPE_CREATED,
        user: req.user,
        cutomPlate: customPlate,
        payload: payload,
        scope: appConstants.SCOPE_USER,
        type: "customPlate",
      },
      req
    );

    // send notification to nearBy chefs
    const chefs = await repository.getNearByUser(
      user.location_lat,
      user.location_lon,
      chef_location_radius,
      "chef"
    );
    const deviceTokens = chefs
      .filter((chef) => chef.deviceToken)
      .map((chef) => chef.deviceToken);
    if (deviceTokens.length > 0) {
      const title = notificationConstant.CUSTOMPLATE_CREATED_TITLE;
      const body = notificationConstant.CUSTOMPLATE_CREATED_BODY;
      let pushnotification = {
        orderTitle: title,
        orderBrief: body,
        device_registration_tokens: deviceTokens,
        detail: chefs,
      };
      FCM(pushnotification);
    }

    return res.status(HttpStatus.CREATED).send({
      message: "The custom plate was successfully added!",
      data: payload,
    });
  } catch (error) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      message: "Internal server error, will get back to you shortly",
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error,
    });
  }
});
