const { Order, ShippingAddress } = require("../../models/index");
exports.getOrdersReadyDelivery = async (data) => {
  try {
    const orders_ready = await Order.findAll({
      where: { state_type: 5 },
      include: [
        {
          model: ShippingAddress,
          as: "shipping",
          attributes: ["lat", "lon"],
        },
      ],
    });
    console.log(orders_ready);
    return orders_ready;
  } catch (e) {
    console.log(e);
    return { message: "Erro to return orders!", error: e };
  }
};
