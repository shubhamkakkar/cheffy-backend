const { Order } = require("../../models/index");
exports.getById = async (orderId) => {
  try {
    return await Order.findByPk(orderId);
  } catch (e) {
    console.log(e);
    throw e;
  }
};
