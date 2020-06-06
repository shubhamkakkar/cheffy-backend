const { Order } = require("../../models/index");

exports.create = async (data) => {
  return await Order.create({ ...data });
};
