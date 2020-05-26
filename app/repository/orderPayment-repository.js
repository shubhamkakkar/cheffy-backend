"use strict";
const moment = require("moment");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const { OrderPayment, User, Wallet, Promotions } = require("../models/index");

exports.create = async (data) => {
  let payment = await OrderPayment.create({ ...data });
  return payment;
};

exports.user = async (data) => {
  try {
    const existUser = await User.findByPk(data);
    return existUser;
  } catch (e) {
    return { message: "Erro to return user!", error: e };
  }
};

exports.promotion = async (promoCode) => {
  const todayDate = moment().format("YYYY-MM-DD h:mm:ss");
  const discount = await Promotions.findOne({
    attributes: ["discount"],
    where: {
      code: promoCode,
      status: 0,
      validity: {
        [Op.gt]: todayDate,
      },
    },
  });
  return discount;
};

exports.getOrderPayments = async (data) => {
  const query = { ...data.pagination };
  return await OrderPayment.findAll(query);
};
