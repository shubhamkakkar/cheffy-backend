const { OrderItem } = require("../../models/index");

exports.getOrderItemById = async (orderItemId) => {
  try {
    const order = await OrderItem.findByPk(orderItemId, {
      attributes: {
        exclude: ["WalletId"],
      },
    });
    return order;
  } catch (e) {
    console.log(e);
    throw e;
  }
};
