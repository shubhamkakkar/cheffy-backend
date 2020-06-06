const { OrderItem } = require("../../models/index");

exports.completeChefOrder = async (orderItemId) => {
  const orderItem = await OrderItem.findByPk(orderItemId);
  orderItem.state_type = "approved";
  return await orderItem.save();
};
