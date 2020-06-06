const { Order } = require("../../models/index");

exports.editOrder = async (orderId, data) => {
  try {
    const order = await Order.findByPk(orderId);
    order.userId = data.userId;

    if (typeof data.basketId !== "undefined") {
      order.basketId = data.basketId;
    }

    if (typeof data.state_type !== "undefined") {
      order.state_type = data.state_type;
    }

    if (typeof data.total_items !== "undefined") {
      order.total_items = data.total_items;
    }

    if (typeof data.shipping_fee !== "undefined") {
      order.shipping_fee = data.shipping_fee;
    }

    if (typeof data.order_total !== "undefined") {
      order.order_total = data.order_total;
    }

    return order.save();
  } catch (e) {
    console.log(e);
    throw e;
  }
};
