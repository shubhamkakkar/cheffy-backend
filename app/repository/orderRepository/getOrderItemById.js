const { OrderItem } = require("../../models/index");

exports.getOrderItemById = async (orderItemId) => {
  try {
    return await OrderItem.findByPk(orderItemId, {
      attributes: {
        exclude: ["WalletId"],
      },
    });
  } catch (e) {
    console.log(e);
    throw e;
  }
};
