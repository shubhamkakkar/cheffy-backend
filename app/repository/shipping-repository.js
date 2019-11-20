'use strict';
const { ShippingAddress } = require("../models/index");

exports.createAddress = async (data) => {
  try {
    const response = await ShippingAddress.create(data);
    return response;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to create shipping address", error: e };
  }
};

exports.checkExistAddress = async (data) => {
  try {
    const existAddress = await ShippingAddress.findOne({
      where: { userId: data.userId, lat: data.lat, lon: data.lon }
    });
    return existAddress;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to check the shipping address", error: e };
  }
};

exports.getUserAddress = async (data) => {
  try {
    const existAddress = await ShippingAddress.findOne({ where: { userId: data } });
    return existAddress;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to check the shipping address", error: e };
  }
};

exports.getExistAddress = async (data) => {
  try {
    const existAddress = await ShippingAddress.findByPk(data);
    return existAddress;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to get the shipping address", error: e };
  }
};

exports.listAddress = async (data) => {
  if (data.page == 1) {
    try {
      const existAddress = await ShippingAddress.findAll({
        where: { userId: data.userId },
        order: [["id", "DESC"]],
        limit: parseInt(data.pageSize)
      });
      return existAddress;
    } catch (e) {
      console.log("Error: ", e);
      return { message: "Fail to get Address!", error: e };
    }
  }

  try {
    let skiper = data.pageSize * (data.page - 1);
    const existAddress = await ShippingAddress.findAll({
      where: { userId: data.userId },
      order: [["id", "DESC"]],
      offset: parseInt(skiper),
      limit: parseInt(data.pageSize)
    });
    return existAddress;
  } catch (e) {
    console.log("Error: ", e);
    return { message: "Fail to get Address!", error: e };
  }
};
