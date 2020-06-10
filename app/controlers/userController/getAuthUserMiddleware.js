("use strict");
const path = require("path");
const HttpStatus = require("http-status-codes");
const asyncHandler = require("express-async-handler");
const userConstants = require(path.resolve("app/constants/users"));
const { User } = require("../../models/index");

module.exports = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: userConstants.privateSelectFields,
      //raw: true
    });

    if (!user) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .send({ message: "User not found", status: HttpStatus.NOT_FOUND });
    }

    req.user = user;
    next();
  } catch (error) {
    next();
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      messege: "Something went wrong, we will get back to you shortly",
      file: "/usercontoller/getAuthUserMiddleware",
      error,
    });
  }
});
