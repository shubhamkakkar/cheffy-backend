'use strict';
const { OrderPayment, User, Wallet } = require("../models/index");

exports.create = async (data) => {
  let payment = await OrderPayment.create({ ...data });
  return payment;
}

exports.user = async (data) => {
  try {
    const existUser = await User.findByPk(data);
    return existUser;
  } catch (e) {
    return { message: "Erro to return user!", error: e}
  }
}
