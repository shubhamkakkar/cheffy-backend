const { Order, ShippingAddress } = require("../../models/index");
exports.getOrdersReadyDelivery = async (data) => {
  try {
    return await Order.findAll({
      where: { state_type: 5 },
      include: [
        {
          model: ShippingAddress,
          as: "shipping",
          attributes: ["lat", "lon"],
        },
      ],
    });
  } catch (e) {
    console.log(e);
    return { message: "Erro to return orders!", error: e };
  }
};
