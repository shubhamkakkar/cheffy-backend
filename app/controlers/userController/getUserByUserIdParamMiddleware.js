("use strict");
const path = require("path");
const HttpStatus = require("http-status-codes");
const asyncHandler = require("express-async-handler");
const userConstants = require(path.resolve("app/constants/users"));
const { User } = require("../../models/index");
module.exports = asyncHandler(async (req, res, next, userId) => {
  try {
    if (!userId) {
      return res.status(HttpStatus.BAD_REQUEST).send({
        message: "Not userId params set in request",
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const user = await User.findByPk(userId, {
      attributes: userConstants.privateSelectFields,
    });

    if (!user) {
      return res.status(HttpStatus.NOT_FOUND).send({
        message: "User not found",
        status: HttpStatus.NOT_FOUND,
      });
    }

    req.paramUser = user;
    next();
  } catch (error) {
    console.log({
      messege: "Something went wrong, we will get back to you shortly",
      file: "/usercontoller/getUserByUserIdParamMiddleware",
      error,
    });
    next();
  }
});
