const { Order } = require("../../models/index");

exports.create = async (data) => {
  let doc = await Order.create({ ...data });
  return doc;
};
