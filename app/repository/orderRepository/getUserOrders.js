const {
  Order,
  OrderPayment,
  OrderItem,
  Plates,
  PlateImage,
  CustomPlateOrder,
  CustomPlate,
  CustomPlateImage,
} = require("../../models/index");

/**
 * Main Table: Orders
 *List user orders
 * User orders are contained in orders table with respective items in orderitems table referenced to orderId
 */
exports.getUserOrders = async (data) => {
  return await Order.findAll({
    where: { userId: data },
    order: [["id", "DESC"]],
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
          "id",
          "plate_id",
          "customPlateId",
          "user_id",
          "chef_id",
          "item_type",
          "chef_location",
          "name",
          "description",
          "amount",
          "quantity",
        ],
        include: [
          {
            model: Plates,
            as: "plate",
            include: [
              {
                model: PlateImage,
              },
            ],
          },
          {
            model: CustomPlateOrder,
            as: "custom_plate_order",
            include: [
              {
                model: CustomPlate,
                as: "custom_plate",
                include: [
                  {
                    model: CustomPlateImage,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });
};
