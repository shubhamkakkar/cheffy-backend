const { Order } = require("../../models/index");
exports.getById = async (orderId) => {
  try {
    const order = await Order.findByPk(orderId);
    return order;
  } catch (e) {
    console.log(e);
    throw e;
  }
};
