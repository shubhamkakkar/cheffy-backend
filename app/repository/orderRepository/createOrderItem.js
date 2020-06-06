const { OrderItem } = require("../../models/index");

exports.createOrderItem = async (data) => {
  return await OrderItem.create(data);
};
