("use strict");
const path = require("path");
const HttpStatus = require("http-status-codes");
const asyncHandler = require("express-async-handler");
const { User, Wallet } = require("../../models/index");
module.exports = asyncHandler(async (req, res, next) => {
  try {
    let wallet = await Wallet.findOne({
      where: { userId: req.userId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "user_type"],
        },
      ],
    });

    if (!wallet) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .send({ message: "Unable to find wallet for this user" });
    }
    return res.status(HttpStatus.OK).send(wallet);
  } catch (error) {
    console.log({ error });
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      messege: "Something went wrong, we will get back to you shortly",
      file: "/usercontoller/getChefOrDriverBalance",
      error: error,
    });
  }
});
