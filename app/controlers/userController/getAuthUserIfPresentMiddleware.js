("use strict");
const path = require("path");
const asyncHandler = require("express-async-handler");
const userConstants = require(path.resolve("app/constants/users"));
const { User } = require("../../models/index");

module.exports = asyncHandler(async (req, res, next) => {
  try {
    if (!req.userId) return next();

    const user = await User.findByPk(req.userId, {
      attributes: userConstants.privateSelectFields,
    });

    if (!user) {
      return next();
    }

    req.user = user;
    next();
  } catch (error) {
    console.log({
      messege: "Something went wrong, we will get back to you shortly",
      file: "/usercontoller/getAuthUserIfPresentMiddleware",
      error,
    });
    next();
  }
});
