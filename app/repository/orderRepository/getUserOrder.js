const { Order, OrderPayment, OrderItem } = require("../../models/index");
exports.getUserOrder = async (data, id) => {
  return await Order.findOne({
    where: { userId: data, id },
    include: [
      {
        model: OrderPayment,
        attributes: [
          "id",
          "amount",
          "client_secret",
          "customer",
          "payment_method",
          "status",
        ],
      },
      {
        model: OrderItem,
        attributes: [
          "plate_id",
          "customPlateId",
          "item_type",
          "chef_location",
          "name",
          "description",
          "amount",
          "quantity",
        ],
      },
    ],
  });
};
