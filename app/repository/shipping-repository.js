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

exports.getUserAddress = async (data, options = {}) => {
    const existAddress = await ShippingAddress.findOne({ where: { userId: data }, ...options });
    return existAddress;
};

/**
* Get user default shippingAddress
*/
exports.getUserDefaultAddress = async(userId, options = {}) => {
  const existAddress = await ShippingAddress.findOne({ where: { userId: userId, isDefaultAddress: true }, ...options});
  return existAddress;
}

exports.getUserAddressByShippingId = async ({userId, shippingId}) => {
    const address = await ShippingAddress.findByPk(shippingId, { where: { userId: userId }});
    return address;
};

exports.userShippingAddressCount = async(userId) => {
  return await ShippingAddress.count({where: {userId}});
}

exports.getExistAddress = async (shippingId) => {
    const existAddress = await ShippingAddress.findByPk(shippingId);
    return existAddress;
};


exports.listAddress = async ({userId, pagination}) => {
  const existAddress = await ShippingAddress.findAll({
    where: { userId: userId },
    order: [["id", "DESC"]],
    ...pagination
  });
  return existAddress;
};
