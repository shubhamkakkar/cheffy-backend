const HttpStatus = require("http-status-codes");
const asyncHandler = require("express-async-handler");
const { OrderItem } = require("../../models/index");
const userResponseHelper = require("./helper/userResponseHelper");
const { Op } = require("sequelize");
module.exports = asyncHandler(async (req, res, next) => {
  try {
    const order_items = await OrderItem.findAll({
      where: {
        [Op.and]: [
          { chef_id: req.userId },
          {
            createdAt: {
              [Op.between]: [req.params.from, req.params.to],
            },
          },
        ],
      },
      attributes: ["id", "orderId", "updatedAt", "amount", "quantity",]
    });

    const user = req.user;
    const userResponse = userResponseHelper({ user });

    let total = 0;

    let balance_history = [];

    let prev_bal = 0;

    if (order_items !== null && order_items.length > 0) {
      order_items.map((elem) => {
        let hist = {};
        hist.date = elem.updatedAt;
        hist.balance = prev_bal + parseFloat(elem.amount * elem.quantity);
        prev_bal = hist.balance;
        balance_history.push(hist);
      });

      total = order_items.reduce(function (prevVal, elem) {
        return parseFloat(prevVal) + parseFloat(elem.amount * elem.quantity);
      }, 0);
    }

    return res.status(HttpStatus.OK).send({
      user: userResponse,
      balance_history: balance_history,
      total: total,
    });
  } catch (error) {
    console.log({ error });
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      messege: "Something went wrong, we will get back to you shortly",
      file: "/usercontoller/getUserBalanceHistory",
      error: error,
    });
  }
});
