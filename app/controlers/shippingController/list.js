const path = require("path");
const paginator = require(path.resolve("app/services/paginator"));
const repository = require("../../repository/shipping-repository");
const HttpStatus = require("http-status-codes");
const asyncHandler = require("express-async-handler");

exports.list = asyncHandler(async (req, res, next) => {
  //TODO improve pagination query.
  //see customPlatesController.listAllCustomPlates
  try {
    const query = {
      userId: req.userId,
      pagination: paginator.paginateQuery(req),
    };
    const addresses = await repository.listAddress(query);

    return res
      .status(HttpStatus.OK)
      .send({ data: addresses, ...paginator.paginateInfo(query.pagination) });
  } catch (error) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      messege: "Something went wrong, we will get back to you shortly",
      file: "/shippingController/list",
      error,
    });
  }
});
