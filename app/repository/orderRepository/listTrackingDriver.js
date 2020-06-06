const {
  Order,
  OrderPayment,
  ShippingAddress,
  OrderItem,
  Plates,
  PlateImage,
  CustomPlateOrder,
  CustomPlate,
  CustomPlateImage,
  OrderDelivery,
} = require("../../models/index");
exports.listTrackingDriver = async (data) => {
  return await Order.findAll({
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
        model: ShippingAddress,
        attributes: [
          "id",
          "addressLine1",
          "addressLine2",
          "city",
          "state",
          "zipCode",
        ],
        as: "shipping",
      },
      {
        model: OrderItem,
        attributes: [
          "id",
          "plate_id",
          "customPlateId",
          "item_type",
          "user_id",
          "chef_id",
          "chef_location",
          "name",
          "description",
          "amount",
          "quantity",
          "deliveryType",
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
      {
        model: OrderDelivery,
        required: true,
        attributes: ["id", "state_type"],
        where: { driverId: data },
      },
    ],
  });
};
