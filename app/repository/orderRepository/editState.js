const { Order } = require("../../models/index");

exports.editState = async (data, state) => {
  let order = await Order.findByPk(data);
  order.state_type = state;
  return await order.save();
};
