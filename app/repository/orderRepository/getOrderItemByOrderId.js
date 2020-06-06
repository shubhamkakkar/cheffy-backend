const {
  User,
  ShippingAddress,
  OrderItem,
  Plates,
  PlateImage,
  CustomPlateOrder,
  CustomPlate,
  CustomPlateImage,
} = require("../../models/index");
const { Op } = require("sequelize");
exports.getOrderItemByOrderId = async (orderId) => {
  const response = await OrderItem.findAll({
    where: {
      orderId: {
        [Op.in]: orderId,
      },
    },
    attributes: [
      "id",
      "orderId",
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
          {
            model: User,
            attributes: [
              "id",
              "name",
              "email",
              "country_code",
              "phone_no",
              "restaurant_name",
              "location_lat",
              "location_lon",
              "imagePath",
              "order_flag",
              "user_type",
            ],
            as: "chef",
            include: [
              {
                model: ShippingAddress,
                as: "address",
                attributes: [
                  "id",
                  "addressLine1",
                  "addressLine2",
                  "city",
                  "state",
                  "zipCode",
                  "lat",
                  "lon",
                  "userId",
                ],
              },
            ],
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
  });
  const orderItem = JSON.parse(JSON.stringify(response));
  orderItem.forEach((value, key) => {
    const obj = orderItem[key];
    obj.chef_name = value.plate.chef.name;
  });
  return orderItem;
};
